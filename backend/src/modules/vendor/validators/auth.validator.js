import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().trim().required(),
    vendorType: Joi.string().trim().valid('Individual', 'Business').required(),
    vendorCountry: Joi.string().trim().required(),
    storeName: Joi.string().trim().min(2).max(100).allow('').optional(),
    storeDescription: Joi.string().trim().max(500).allow('').optional(),
    address: Joi.any().optional(),
    businessName: Joi.string().trim().allow('').optional(),
    businessType: Joi.string().trim().allow('').optional(),
    businessCountry: Joi.string().trim().allow('').optional(),
    businessAddress: Joi.string().trim().allow('').optional(),
    kycDocumentType: Joi.string().trim().allow('').optional(),
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resendOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

export const logoutSchema = Joi.object({
    refreshToken: Joi.string().allow('').optional(),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
});

export const verifyResetOtpSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resetPasswordSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match password.',
    }),
});

export const checkAvailabilitySchema = Joi.object({
    email: Joi.string().email().lowercase().optional(),
    phone: Joi.string().trim().optional(),
    storeName: Joi.string().trim().min(2).max(100).optional(),
});

