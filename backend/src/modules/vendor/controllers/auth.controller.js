import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { generateTokens } from '../../../utils/generateToken.js';
import { sendOTP } from '../../../services/otp.service.js';
import { createNotification } from '../../../services/notification.service.js';
import { sendEmail } from '../../../services/email.service.js';
import bcrypt from 'bcryptjs';
import {
    clearRefreshSession,
    decodeRefreshTokenOrThrow,
    persistRefreshSession,
    rotateRefreshSession,
} from '../../../services/refreshToken.service.js';
import { uploadToCloudinary } from '../../../services/upload.service.js';
import fs from 'fs';

const sanitizeVendor = (vendor) => {
    if (!vendor) return null;
    const sanitized = { ...vendor, id: vendor._id || vendor.id };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;
    delete sanitized.resetOtp;
    delete sanitized.resetOtpExpiry;
    delete sanitized.resetOtpVerified;
    delete sanitized.refreshTokenHash;
    delete sanitized.refreshTokenExpiresAt;
    return sanitized;
};

// POST /api/vendor/auth/register
export const register = asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const Admin = mongoose.model('Admin');

    const {
        name, email, password, phone, storeName, storeDescription,
        vendorType, vendorCountry, businessName, businessType, businessCountry, businessAddress, kycDocumentType
    } = req.body;

    let { address } = req.body;
    if (typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch (e) {
            // keep it as is or handle error
        }
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();

    const existing = await Vendor.findOne({ email: normalizedEmail }).lean();
    if (existing) throw new ApiError(409, 'Email already registered.');

    if (phone) {
        const normalizedPhone = String(phone).trim();
        const existingPhone = await Vendor.findOne({ phone: normalizedPhone }).lean();
        if (existingPhone) throw new ApiError(409, 'Phone number already registered.');
    }

    if (storeName) {
        const normalizedStoreName = String(storeName).trim();
        const existingStore = await Vendor.findOne({
            storeName: { $regex: new RegExp(`^${normalizedStoreName}$`, 'i') }
        }).lean();
        if (existingStore) throw new ApiError(409, 'Store name is already taken.');
    }

    const files = req.files || {};
    const isBusiness = vendorType === 'Business';

    if (isBusiness && (!files.kycDocument || !files.kycDocument[0])) {
        throw new ApiError(400, 'KYC Document is required for Business vendors.');
    }
    if (!files.governmentIdDocument || !files.governmentIdDocument[0]) {
        throw new ApiError(400, 'Government ID Document is required.');
    }

    let kycDocumentUrl = '';
    let governmentIdDocumentUrl = '';

    try {
        if (isBusiness && files.kycDocument && files.kycDocument[0]) {
            const kycFile = files.kycDocument[0];
            const kycUploadResult = await uploadToCloudinary(kycFile.path, 'vendor_kyc');
            kycDocumentUrl = kycUploadResult.url || kycUploadResult.secure_url;
            if (fs.existsSync(kycFile.path)) fs.unlinkSync(kycFile.path);
        }

        const govFile = files.governmentIdDocument[0];
        const govUploadResult = await uploadToCloudinary(govFile.path, 'vendor_kyc');
        governmentIdDocumentUrl = govUploadResult.url || govUploadResult.secure_url;
        if (fs.existsSync(govFile.path)) fs.unlinkSync(govFile.path);

    } catch (error) {
        console.error('[Vendor Register] Upload error:', error);
        if (files.kycDocument && files.kycDocument[0] && fs.existsSync(files.kycDocument[0].path)) fs.unlinkSync(files.kycDocument[0].path);
        if (files.governmentIdDocument && files.governmentIdDocument[0] && fs.existsSync(files.governmentIdDocument[0].path)) fs.unlinkSync(files.governmentIdDocument[0].path);
        throw new ApiError(500, 'Error uploading documents. Please try again.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const vendor = await Vendor.create({
        name: String(name || '').trim(),
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone ? String(phone).trim() : null,
        storeName: String(storeName || '').trim(),
        storeDescription: storeDescription ? String(storeDescription).trim() : null,
        address: address || null,
        status: 'pending',
        vendorType: String(vendorType || 'Individual').trim(),
        vendorCountry: String(vendorCountry || '').trim(),
        businessName: String(businessName || '').trim(),
        businessType: String(businessType || '').trim(),
        businessCountry: String(businessCountry || '').trim(),
        businessAddress: String(businessAddress || '').trim(),
        kycDocumentType: String(kycDocumentType || '').trim(),
        kycDocumentUrl: kycDocumentUrl,
        governmentIdDocumentUrl: governmentIdDocumentUrl
    });

    const admins = await Admin.find({ isActive: true }).select('_id').lean();

    await Promise.all(
        admins.map((admin) =>
            createNotification({
                recipientId: String(admin._id),
                recipientType: 'admin',
                title: 'New Vendor Registration',
                message: `${vendor.storeName || vendor.name} has registered and is awaiting review.`,
                type: 'system',
                data: {
                    vendorId: String(vendor._id),
                    vendorEmail: vendor.email,
                    status: vendor.status,
                },
            })
        )
    );

    res.status(201).json(new ApiResponse(201, { email: vendor.email }, 'Registration submitted. Please login to verify your email.'));
});

// POST /api/vendor/auth/verify-otp
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOne({ email });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (vendor.otp !== otp) throw new ApiError(400, 'Invalid OTP.');
    if (vendor.otpExpiry < new Date()) throw new ApiError(400, 'OTP has expired.');

    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpiry = null;
    await vendor.save();

    res.status(200).json(new ApiResponse(200, null, 'Email verified. Awaiting admin approval.'));
});

// POST /api/vendor/auth/resend-otp
export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required.');

    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ email });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (vendor.isVerified) throw new ApiError(400, 'Email is already verified.');

    await sendOTP('vendor', vendor, 'vendor_verification');
    res.status(200).json(new ApiResponse(200, null, 'OTP resent successfully. Please check your email.'));
});

// POST /api/vendor/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOne({ email: normalizedEmail });

    if (!vendor) {
        return res.status(200).json(
            new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
        );
    }

    const isMock = process.env.MOCK_EMAIL_SMTP === 'true';
    const otp = isMock ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
    vendor.resetOtp = otp;
    vendor.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    vendor.resetOtpVerified = false;
    await vendor.save();

    if (isMock) {
        console.log(`[MOCK RESET OTP] Vendor password reset OTP generated for ${vendor.email}: ${otp} (SMTP bypassed)`);
        return res.status(200).json(
            new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
        );
    }

    try {
        await sendEmail({
            to: vendor.email,
            subject: 'Vendor password reset OTP',
            text: `Your password reset OTP is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your password reset OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        console.warn(`[Vendor Forgot Password] Email send failed for ${vendor.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Vendor Forgot Password] Reset OTP generated for ${vendor.email}`);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, null, 'If the email exists, a reset OTP has been sent.')
    );
});

// POST /api/vendor/auth/verify-reset-otp
export const verifyResetOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOne({ email: normalizedEmail });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.resetOtp || !vendor.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (vendor.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');
    if (vendor.resetOtp !== String(otp)) throw new ApiError(400, 'Invalid reset OTP.');

    vendor.resetOtpVerified = true;
    await vendor.save();

    return res.status(200).json(new ApiResponse(200, null, 'Reset OTP verified.'));
});

// POST /api/vendor/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOne({ email: normalizedEmail });
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    if (!vendor.resetOtpVerified) throw new ApiError(400, 'Please verify reset OTP first.');
    if (!vendor.resetOtp || !vendor.resetOtpExpiry) throw new ApiError(400, 'No reset OTP requested.');
    if (vendor.resetOtpExpiry < new Date()) throw new ApiError(400, 'Reset OTP has expired.');

    const hashedPassword = await bcrypt.hash(password, 12);
    vendor.password = hashedPassword;
    vendor.resetOtp = null;
    vendor.resetOtpExpiry = null;
    vendor.resetOtpVerified = false;
    vendor.refreshTokenHash = null;
    vendor.refreshTokenExpiresAt = null;
    await vendor.save();

    return res.status(200).json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});

// POST /api/vendor/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const Vendor = mongoose.model('Vendor');

    const vendor = await Vendor.findOne({ email });
    if (!vendor) throw new ApiError(401, 'Invalid credentials.');

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

    if (!vendor.isVerified) {
        await sendOTP('vendor', vendor, 'vendor_verification');
        throw new ApiError(403, 'Please verify your email first.');
    }

    if (vendor.status === 'pending') throw new ApiError(403, 'Your account is pending admin approval.');
    if (vendor.status === 'suspended') throw new ApiError(403, `Your account has been suspended. Reason: ${vendor.suspensionReason || 'Contact support.'}`);
    if (vendor.status === 'rejected') throw new ApiError(403, 'Your vendor application was rejected.');

    const { accessToken, refreshToken } = generateTokens({ id: vendor._id, role: 'vendor', email: vendor.email });
    await persistRefreshSession('vendor', vendor._id, refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, vendor: { id: vendor._id, name: vendor.name, storeName: vendor.storeName, email: vendor.email, storeLogo: vendor.storeLogo, isOnboarded: vendor.isOnboarded } }, 'Login successful.'));
});

// POST /api/vendor/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const Vendor = mongoose.model('Vendor');
    const decoded = decodeRefreshTokenOrThrow(refreshToken);
    const vendor = await Vendor.findOne({ _id: decoded.id });

    if (!vendor) throw new ApiError(401, 'Invalid refresh token.');
    if (!vendor.isVerified) throw new ApiError(403, 'Please verify your email first.');
    if (vendor.status === 'pending') throw new ApiError(403, 'Your account is pending admin approval.');
    if (vendor.status === 'suspended') throw new ApiError(403, `Your account has been suspended. Reason: ${vendor.suspensionReason || 'Contact support.'}`);
    if (vendor.status === 'rejected') throw new ApiError(403, 'Your vendor application was rejected.');

    const tokens = await rotateRefreshSession(
        'vendor',
        vendor._id,
        { id: vendor._id, role: 'vendor', email: vendor.email },
        refreshToken
    );

    return res.status(200).json(new ApiResponse(200, tokens, 'Session refreshed successfully.'));
});

// POST /api/vendor/auth/logout
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const Vendor = mongoose.model('Vendor');
    if (refreshToken) {
        try {
            const decoded = decodeRefreshTokenOrThrow(refreshToken);
            const vendor = await Vendor.findOne({ _id: decoded.id }).lean();
            if (vendor?.refreshTokenHash) {
                await clearRefreshSession('vendor', vendor._id);
            }
        } catch {
            // Keep logout idempotent.
        }
    }

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// GET /api/vendor/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ _id: req.user.id }).lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');
    res.status(200).json(new ApiResponse(200, sanitizeVendor(vendor), 'Profile fetched.'));
});

// PUT /api/vendor/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    if (req.body.storeName !== undefined) {
        const normalizedStoreName = String(req.body.storeName || '').trim();
        if (normalizedStoreName) {
            const existingStore = await Vendor.findOne({
                storeName: { $regex: new RegExp(`^${normalizedStoreName}$`, 'i') },
                _id: { $ne: req.user.id }
            }).lean();
            if (existingStore) throw new ApiError(409, 'Store name is already taken.');
        }
    }
    if (req.body.phone !== undefined) {
        const normalizedPhone = String(req.body.phone || '').trim();
        if (normalizedPhone) {
            const existingPhone = await Vendor.findOne({
                phone: normalizedPhone,
                _id: { $ne: req.user.id }
            }).lean();
            if (existingPhone) throw new ApiError(409, 'Phone number is already taken.');
        }
    }
    const allowed = [
        'name',
        'phone',
        'storeName',
        'storeDescription',
        'storeLogo',
        'storeBanner',
        'storePolicies',
        'refundPolicy',
        'shippingPolicy',
        'address',
        'shippingEnabled',
        'freeShippingThreshold',
        'defaultShippingRate',
        'shippingMethods',
        'handlingTime',
        'processingTime',
    ];
    const updates = {};
    allowed.forEach((k) => {
        if (req.body[k] !== undefined) {
            updates[k] = req.body[k];
        }
    });

    const { latitude, longitude } = req.body;

    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
        updates.location = {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };
    }

    const vendor = await Vendor.findOneAndUpdate(
        { _id: req.user.id },
        { $set: updates },
        { new: true }
    ).lean();

    res.status(200).json(new ApiResponse(200, sanitizeVendor(vendor), 'Profile updated.'));
});

// PUT /api/vendor/auth/bank-details
export const updateBankDetails = asyncHandler(async (req, res) => {
    const { accountName, accountNumber, bankName, ifscCode } = req.body;
    if (!accountName && !accountNumber && !bankName && !ifscCode) {
        throw new ApiError(400, 'At least one bank detail field is required.');
    }

    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ _id: req.user.id }).lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const currentBankDetails = vendor.bankDetails && typeof vendor.bankDetails === 'object'
        ? vendor.bankDetails
        : {};

    const updatedBankDetails = {
        ...currentBankDetails,
        ...(accountName ? { accountName } : {}),
        ...(accountNumber ? { accountNumber } : {}),
        ...(bankName ? { bankName } : {}),
        ...(ifscCode ? { ifscCode } : {}),
    };

    const updatedVendor = await Vendor.findOneAndUpdate(
        { _id: req.user.id },
        { $set: { bankDetails: updatedBankDetails } },
        { new: true }
    ).lean();

    res.status(200).json(new ApiResponse(200, sanitizeVendor(updatedVendor), 'Bank details updated.'));
});

// PATCH /api/vendor/auth/complete-onboarding
export const completeOnboarding = asyncHandler(async (req, res) => {
    const Vendor = mongoose.model('Vendor');
    const vendor = await Vendor.findOne({ _id: req.user.id }).lean();
    if (!vendor) throw new ApiError(404, 'Vendor not found.');

    const updatedVendor = await Vendor.findOneAndUpdate(
        { _id: req.user.id },
        { $set: { isOnboarded: true } },
        { new: true }
    ).lean();

    res.status(200).json(new ApiResponse(200, sanitizeVendor(updatedVendor), 'Onboarding completed successfully.'));
});

// POST /api/vendor/auth/check-availability
export const checkAvailability = asyncHandler(async (req, res) => {
    const { email, phone, storeName } = req.body;
    const Vendor = mongoose.model('Vendor');

    if (email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const existing = await Vendor.findOne({ email: normalizedEmail }).lean();
        if (existing) {
            throw new ApiError(409, 'Email already registered.');
        }
    }

    if (phone) {
        const normalizedPhone = String(phone).trim();
        const existingPhone = await Vendor.findOne({ phone: normalizedPhone }).lean();
        if (existingPhone) {
            throw new ApiError(409, 'Phone number already registered.');
        }
    }

    if (storeName) {
        const normalizedStoreName = String(storeName).trim();
        const existingStore = await Vendor.findOne({
            storeName: { $regex: new RegExp(`^${normalizedStoreName}$`, 'i') }
        }).lean();
        if (existingStore) {
            throw new ApiError(409, 'Store name is already taken.');
        }
    }

    res.status(200).json(new ApiResponse(200, { available: true }, 'Credentials are available.'));
});
