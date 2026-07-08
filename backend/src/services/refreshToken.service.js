import crypto from 'crypto';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { verifyRefreshToken } from '../config/jwt.js';
import { generateTokens } from '../utils/generateToken.js';

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const getMongooseModel = (role) => {
    switch (role) {
        case 'customer':
            return mongoose.model('User');
        case 'vendor':
            return mongoose.model('Vendor');
        case 'delivery':
            return mongoose.model('DeliveryBoy');
        case 'admin':
            return mongoose.model('Admin');
        default:
            throw new ApiError(500, `Unknown role for token session: ${role}`);
    }
};

export const decodeRefreshTokenOrThrow = (token) => {
    try {
        return verifyRefreshToken(String(token || ''));
    } catch {
        throw new ApiError(401, 'Invalid or expired refresh token.');
    }
};

export const persistRefreshSession = async (role, accountId, refreshToken) => {
    const decoded = decodeRefreshTokenOrThrow(refreshToken);
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;

    const Model = getMongooseModel(role);
    await Model.updateOne(
        { _id: accountId },
        {
            $set: {
                refreshTokenHash,
                refreshTokenExpiresAt,
            }
        }
    );
};

export const clearRefreshSession = async (role, accountId) => {
    const Model = getMongooseModel(role);
    await Model.updateOne(
        { _id: accountId },
        {
            $set: {
                refreshTokenHash: null,
                refreshTokenExpiresAt: null,
            }
        }
    );
};

export const rotateRefreshSession = async (role, accountId, payload, incomingRefreshToken) => {
    if (!incomingRefreshToken) {
        throw new ApiError(400, 'Refresh token is required.');
    }

    const decoded = decodeRefreshTokenOrThrow(incomingRefreshToken);
    if (!decoded?.id || String(decoded.id) !== String(accountId)) {
        throw new ApiError(401, 'Invalid refresh token.');
    }

    const incomingHash = hashToken(incomingRefreshToken);
    const Model = getMongooseModel(role);

    const account = await Model.findOne({ _id: accountId })
        .select('refreshTokenHash refreshTokenExpiresAt')
        .lean();

    if (!account) {
        throw new ApiError(401, 'Account not found.');
    }

    const storedHash = account.refreshTokenHash;
    const expiresAt = account.refreshTokenExpiresAt ? new Date(account.refreshTokenExpiresAt) : null;

    if (!storedHash || incomingHash !== storedHash) {
        throw new ApiError(401, 'Refresh token is invalid or already rotated.');
    }

    if (expiresAt && expiresAt <= new Date()) {
        await clearRefreshSession(role, accountId);
        throw new ApiError(401, 'Refresh token has expired. Please login again.');
    }

    const { accessToken, refreshToken } = generateTokens(payload);
    await persistRefreshSession(role, accountId, refreshToken);

    return { accessToken, refreshToken };
};
