import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { generateTokens } from '../../../utils/generateToken.js';
import { sendOTP } from '../../../services/otp.service.js';
import { sendEmail } from '../../../services/email.service.js';
import bcrypt from 'bcryptjs';
import {
    uploadLocalFileToCloudinaryAndCleanup,
    deleteFromCloudinary,
    cleanupLocalFiles,
} from '../../../services/upload.service.js';
import {
    clearRefreshSession,
    decodeRefreshTokenOrThrow,
    persistRefreshSession,
    rotateRefreshSession,
} from '../../../services/refreshToken.service.js';

const extractCloudinaryPublicId = (url = '') => {
    const raw = String(url || '').trim();
    if (!raw || !raw.includes('/upload/')) return null;
    try {
        const afterUpload = raw.split('/upload/')[1] || '';
        const withoutTransform = afterUpload.includes('/') ? afterUpload.substring(afterUpload.indexOf('/') + 1) : afterUpload;
        const cleaned = withoutTransform.replace(/^v\d+\//, '');
        const withoutExtension = cleaned.replace(/\.[^/.]+$/, '');
        return withoutExtension || null;
    } catch {
        return null;
    }
};

const sanitizeUser = (user) => {
    if (!user) return null;
    const sanitized = { ...user, id: String(user._id) };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;
    delete sanitized.resetOtp;
    delete sanitized.resetOtpExpiry;
    delete sanitized.resetOtpVerified;
    delete sanitized.refreshTokenHash;
    delete sanitized.refreshTokenExpiresAt;
    delete sanitized.passwordResetToken;
    delete sanitized.passwordResetExpiry;
    return sanitized;
};

// POST /api/user/auth/register
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    const User = mongoose.model('User');

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) throw new ApiError(409, 'Email already registered.');

    if (normalizedPhone) {
        const existingPhone = await User.findOne({ phone: normalizedPhone }).lean();
        if (existingPhone) throw new ApiError(409, 'Phone number already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
        name: String(name || '').trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone || null,
    });
    await sendOTP('customer', user, 'email_verification');

    res.status(201).json(new ApiResponse(201, { email: user.email }, 'Registration successful. Please verify your email.'));
});

// POST /api/user/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.otp !== otp) throw new ApiError(400, 'Invalid OTP.');
    if (user.otpExpiry < new Date()) throw new ApiError(400, 'OTP has expired. Please request a new one.');

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const { accessToken, refreshToken } = generateTokens({ id: String(user._id), role: 'customer', email: user.email });
    await persistRefreshSession('customer', String(user._id), refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, user: { id: String(user._id), name: user.name, email: user.email } }, 'Email verified successfully.'));
});

// POST /api/user/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(401, 'Invalid email or password.');
    if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated.');
    if (!user.isVerified) {
        await sendOTP('customer', user, 'email_verification');
        throw new ApiError(403, 'Email not verified. A new OTP has been sent to your email.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

    const { accessToken, refreshToken } = generateTokens({ id: String(user._id), role: 'customer', email: user.email });
    await persistRefreshSession('customer', String(user._id), refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, user: { id: String(user._id), name: user.name, email: user.email, avatar: user.avatar } }, 'Login successful.'));
});

// POST /api/user/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const decoded = decodeRefreshTokenOrThrow(refreshToken);

    const User = mongoose.model('User');
    const user = await User.findOne({ _id: decoded.id }).lean();

    if (!user) throw new ApiError(401, 'Invalid refresh token.');
    if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated.');
    if (!user.isVerified) throw new ApiError(403, 'Please verify your email first.');

    const tokens = await rotateRefreshSession(
        'customer',
        String(user._id),
        { id: String(user._id), role: 'customer', email: user.email },
        refreshToken
    );

    return res.status(200).json(
        new ApiResponse(200, tokens, 'Session refreshed successfully.')
    );
});

// POST /api/user/auth/logout
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            const decoded = decodeRefreshTokenOrThrow(refreshToken);
            const User = mongoose.model('User');
            const user = await User.findOne({ _id: decoded.id }).lean();
            if (user?.refreshTokenHash) {
                await clearRefreshSession('customer', String(user._id));
            }
        } catch {
            // Keep logout idempotent.
        }
    }
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// POST /api/user/auth/resend-otp
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, 'User not found.');
    if (user.isVerified) throw new ApiError(400, 'Email already verified.');

    await sendOTP('customer', user, 'email_verification');
    res.status(200).json(new ApiResponse(200, null, 'OTP resent successfully.'));
});

// POST /api/user/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to avoid account enumeration.
    if (!user) {
        return res.status(200).json(new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.'));
    }
    if (!user.isVerified) {
        await sendOTP('customer', user, 'email_verification');
        throw new ApiError(403, 'Please verify your email first. A new verification OTP has been sent.');
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                resetOtp: otp,
                resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
                resetOtpVerified: false,
            }
        }
    );

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password reset OTP',
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        console.warn(`[User Forgot Password] Email send failed for ${user.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[User Forgot Password] Reset OTP generated for ${user.email}`);
        }
    }

    return res.status(200).json(new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.'));
});

// POST /api/user/auth/verify-reset-otp
export const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, 'User not found.');
    if (!user.resetOtp || !user.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (user.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');
    if (user.resetOtp !== String(otp)) throw new ApiError(400, 'Invalid reset OTP.');

    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                resetOtpVerified: true,
            }
        }
    );

    return res.status(200).json(new ApiResponse(200, null, 'Reset OTP verified.'));
});

// POST /api/user/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const User = mongoose.model('User');

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new ApiError(404, 'User not found.');
    if (!user.resetOtpVerified) throw new ApiError(400, 'Please verify reset OTP first.');
    if (!user.resetOtp || !user.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (user.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');

    const hashedPassword = await bcrypt.hash(password, 12);
    await User.updateOne(
        { _id: user._id },
        {
            $set: {
                password: hashedPassword,
                resetOtp: null,
                resetOtpExpiry: null,
                resetOtpVerified: false,
                refreshTokenHash: null,
                refreshTokenExpiresAt: null,
            }
        }
    );

    return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});

// GET /api/user/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const User = mongoose.model('User');
    const user = await User.findOne({ _id: req.user.id }).lean();
    if (!user) throw new ApiError(404, 'User not found.');
    res.status(200).json(new ApiResponse(200, sanitizeUser(user), 'Profile fetched.'));
});

// PUT /api/user/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    const User = mongoose.model('User');

    if (normalizedPhone) {
        const existingPhone = await User.findOne({
            phone: normalizedPhone,
            _id: { $ne: req.user.id }
        }).lean();
        if (existingPhone) throw new ApiError(409, 'Phone number is already taken.');
    }

    const updatePayload = {
        name: normalizedName,
        phone: normalizedPhone || undefined,
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user.id },
        { $set: updatePayload },
        { new: true }
    ).lean();

    if (!user) throw new ApiError(404, 'User not found.');
    res.status(200).json(new ApiResponse(200, sanitizeUser(user), 'Profile updated.'));
});

// POST /api/user/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Current password and new password are required.');
    }

    const User = mongoose.model('User');

    const user = await User.findOne({ _id: req.user.id });
    if (!user) throw new ApiError(404, 'User not found.');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ApiError(400, 'Current password is incorrect.');
    if (String(currentPassword) === String(newPassword)) {
        throw new ApiError(400, 'New password must be different from current password.');
    }
    if (String(newPassword).length < 6) {
        throw new ApiError(400, 'New password must be at least 6 characters.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully.'));
});

// POST /api/user/auth/profile/avatar
export const uploadProfileAvatar = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, 'Avatar image file is required.');
    }

    const User = mongoose.model('User');

    let uploaded = null;
    try {
        uploaded = await uploadLocalFileToCloudinaryAndCleanup(
            req.file.path,
            'users/avatars'
        );

        const existingUser = await User.findOne({ _id: req.user.id }).select('avatar').lean();
        if (!existingUser) throw new ApiError(404, 'User not found.');
        const previousAvatar = String(existingUser.avatar || '').trim();

        const user = await User.findOneAndUpdate(
            { _id: req.user.id },
            { $set: { avatar: uploaded.url } },
            { new: true }
        ).lean();

        if (!user) throw new ApiError(404, 'User not found.');

        const previousPublicId = extractCloudinaryPublicId(previousAvatar);
        if (previousPublicId && previousPublicId !== uploaded.publicId) {
            await deleteFromCloudinary(previousPublicId).catch(() => null);
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { user: sanitizeUser(user), avatar: uploaded.url, publicId: uploaded.publicId },
                'Profile picture updated successfully.'
            )
        );
    } catch (error) {
        if (!uploaded) {
            await cleanupLocalFiles([req.file?.path]);
        }
        if (uploaded?.publicId) {
            await deleteFromCloudinary(uploaded.publicId).catch(() => null);
        }
        throw error;
    }
});

// POST /api/user/auth/check-availability
export const checkAvailability = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;

    const User = mongoose.model('User');

    if (email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail }).lean();
        if (existing) {
            throw new ApiError(409, 'Email already registered.');
        }
    }

    if (phone) {
        const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
        if (normalizedPhone) {
            const existingPhone = await User.findOne({ phone: normalizedPhone }).lean();
            if (existingPhone) {
                throw new ApiError(409, 'Phone number already registered.');
            }
        }
    }

    res.status(200).json(new ApiResponse(200, { available: true }, 'Email and phone are available.'));
});
