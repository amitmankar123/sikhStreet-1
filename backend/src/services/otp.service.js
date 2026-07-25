import crypto from 'crypto';
import mongoose from 'mongoose';
import { sendEmail } from './email.service.js';

/**
 * Generates a 6-digit OTP and updates the database record
 * @param {string} role - 'customer' or 'vendor'
 * @param {Object} user - User or Vendor object
 * @param {string} type - Purpose label (for logging)
 */
export const sendOTP = async (role, user, type = 'verification') => {
    const isMock = process.env.MOCK_EMAIL_SMTP === 'true';
    const otp = isMock ? '123456' : crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const Model = role === 'vendor' ? mongoose.model('Vendor') : mongoose.model('User');
    await Model.updateOne(
        { _id: user.id || user._id },
        {
            $set: {
                otp,
                otpExpiry,
            }
        }
    );

    // Sync properties locally so downstream code has reference
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    if (isMock) {
        console.log(`[MOCK OTP] ${type} OTP generated for ${user.email}: ${otp} (SMTP bypassed)`);
        return otp;
    }

    try {
        await sendEmail({
            to: user.email,
            subject: 'Your verification code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
        });
    } catch (err) {
        // Keep auth flow working in environments where SMTP is not configured.
        console.warn(`[OTP] Email send failed for ${user.email}: ${err.message}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[OTP] ${type} OTP generated for ${user.email}`);
        }
    }

    return otp;
};
