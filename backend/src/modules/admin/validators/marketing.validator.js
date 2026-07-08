import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i);

export const marketingIdParamSchema = Joi.object({
    id: objectId.required(),
});

export const campaignListQuerySchema = Joi.object({
    status: Joi.string().trim().allow('').optional(),
    type: Joi.string().trim().allow('').optional(),
});

