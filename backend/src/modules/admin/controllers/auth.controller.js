import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import { generateTokens } from '../../../utils/generateToken.js';
import bcrypt from 'bcryptjs';
import {
    clearRefreshSession,
    decodeRefreshTokenOrThrow,
    persistRefreshSession,
    rotateRefreshSession,
} from '../../../services/refreshToken.service.js';

// POST /api/admin/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const Admin = mongoose.model('Admin');

    const admin = await Admin.findOne({ email }).lean();
    if (!admin) throw new ApiError(401, 'Invalid credentials.');
    if (!admin.isActive) throw new ApiError(403, 'Admin account is deactivated.');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials.');

    const { accessToken, refreshToken } = generateTokens({ id: admin._id, role: 'admin', email: admin.email });
    await persistRefreshSession('admin', admin._id, refreshToken);
    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken, admin: { id: String(admin._id), name: admin.name, email: admin.email, role: admin.role } }, 'Admin login successful.'));
});

// POST /api/admin/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const Admin = mongoose.model('Admin');
    const decoded = decodeRefreshTokenOrThrow(refreshToken);
    const admin = await Admin.findOne({ _id: decoded.id })
        .select('email isActive role refreshTokenHash refreshTokenExpiresAt')
        .lean();

    if (!admin) throw new ApiError(401, 'Invalid refresh token.');
    if (!admin.isActive) throw new ApiError(403, 'Admin account is deactivated.');

    const payloadRole = admin.role === 'superadmin' ? 'superadmin' : 'admin';
    const tokens = await rotateRefreshSession(
        'admin',
        admin._id,
        { id: admin._id, role: payloadRole, email: admin.email },
        refreshToken
    );

    return res.status(200).json(new ApiResponse(200, tokens, 'Session refreshed successfully.'));
});

// POST /api/admin/auth/logout
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const Admin = mongoose.model('Admin');
    if (refreshToken) {
        try {
            const decoded = decodeRefreshTokenOrThrow(refreshToken);
            const admin = await Admin.findOne({ _id: decoded.id })
                .select('refreshTokenHash')
                .lean();
            if (admin?.refreshTokenHash) {
                await clearRefreshSession('admin', admin._id);
            }
        } catch {
            // Keep logout idempotent.
        }
    }

    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
});

// GET /api/admin/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
    const Admin = mongoose.model('Admin');
    const admin = await Admin.findOne({ _id: req.user.id }).lean();
    if (!admin) throw new ApiError(404, 'Admin not found.');

    const sanitized = { ...admin, id: String(admin._id) };
    delete sanitized.password;
    delete sanitized.refreshTokenHash;
    delete sanitized.refreshTokenExpiresAt;

    res.status(200).json(new ApiResponse(200, sanitized, 'Profile fetched.'));
});
