import { runInTransaction } from '../../../utils/transaction.js';
import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { slugify } from '../../../utils/slugify.js';

const COUPON_TYPES = new Set(['percentage', 'fixed', 'freeship']);

const toFiniteNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const toBooleanOrNull = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return null;
};

const toValidDateOrNull = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isExternalLink = (value) => /^https?:\/\//i.test(String(value || '').trim());
const isSafeInternalPath = (value) => String(value || '').trim().startsWith('/');
const KNOWN_BANNER_INTERNAL_ROUTE_PATTERNS = [
    /^\/$/,
    /^\/home$/,
    /^\/search$/,
    /^\/offers$/,
    /^\/daily-deals$/,
    /^\/flash-sale$/,
    /^\/new-arrivals$/,
    /^\/categories$/,
    /^\/category\/[^/?#]+$/,
    /^\/brand\/[^/?#]+$/,
    /^\/seller\/[^/?#]+$/,
    /^\/product\/[^/?#]+$/,
    /^\/sale\/[^/?#]+$/,
    /^\/track-order\/[^/?#]+$/,
];
const getPathnameFromTarget = (target) =>
    String(target || '').trim().split('?')[0].split('#')[0];
const isKnownBannerInternalPath = (target) => {
    const pathname = getPathnameFromTarget(target);
    if (!pathname) return false;
    return KNOWN_BANNER_INTERNAL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
};
const normalizeBannerLink = (value) => {
    const candidate = String(value || '').trim();
    if (!candidate) return '';
    if (isExternalLink(candidate)) return candidate;
    if (isSafeInternalPath(candidate) && isKnownBannerInternalPath(candidate)) return candidate;
    return '';
};

const normalizeBannerPayload = (payload = {}) => ({
    ...payload,
    link: normalizeBannerLink(payload?.link),
});

const normalizeObjectIdList = (values) => {
    if (!Array.isArray(values)) return [];
    return values
        .map((value) => String(value || '').trim())
        .filter((value) => value.length > 0);
};

const ensureUniqueCampaignSlug = async (baseNameOrSlug, excludeId = null) => {
    const Campaign = mongoose.model('Campaign');
    const base = slugify(String(baseNameOrSlug || '').trim()) || `campaign-${Date.now()}`;
    let candidate = base;
    let counter = 1;
    while (true) {
        const query = { slug: candidate };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const exists = await Campaign.findOne(query).lean();
        if (!exists) return candidate;
        candidate = `${base}-${counter}`;
        counter += 1;
    }
};

const syncCampaignBanner = async (campaign, previousRoute = null) => {
    if (!campaign?.autoCreateBanner || !campaign?.route) return;

    const Banner = mongoose.model('Banner');

    const title = campaign.bannerConfig?.title || campaign.name || 'Special Offer';
    const subtitle =
        campaign.bannerConfig?.subtitle ||
        (campaign.discountType === 'percentage'
            ? `${campaign.discountValue || 0}% OFF`
            : `Save ${campaign.discountValue || 0}`);

    const image = campaign.bannerConfig?.image || '';
    const bannerPayload = {
        title,
        subtitle,
        description: campaign.description || '',
        link: campaign.route,
        type: 'promotional',
        isActive: !!campaign.isActive,
    };
    if (image) {
        bannerPayload.image = image;
    }

    const baseFilter = { type: 'promotional' };
    if (previousRoute && previousRoute !== campaign.route) {
        const existingPrevious = await Banner.findOne({ ...baseFilter, link: previousRoute }).lean();
        if (existingPrevious) {
            await Banner.updateOne(
                { _id: existingPrevious._id },
                { $set: bannerPayload }
            );
            return;
        }
    }

    const existing = await Banner.findOne({ ...baseFilter, link: campaign.route }).lean();
    if (existing) {
        await Banner.updateOne(
            { _id: existing._id },
            { $set: bannerPayload }
        );
        return;
    }

    if (bannerPayload.image) {
        await Banner.create({
            ...bannerPayload,
            image: bannerPayload.image || ''
        });
    }
};

const deactivateCampaignBannersByRoutes = async (routes = []) => {
    const uniqueRoutes = [...new Set(
        routes
            .map((route) => String(route || '').trim())
            .filter(Boolean)
    )];
    if (!uniqueRoutes.length) return;

    const Banner = mongoose.model('Banner');
    await Banner.updateMany(
        { type: 'promotional', link: { $in: uniqueRoutes } },
        { $set: { isActive: false } }
    );
};

const formatCoupon = (coupon) => {
    return {
        ...coupon,
        id: String(coupon._id || coupon.id),
        minPurchase: coupon.minOrderValue ?? 0,
        startDate: coupon.startsAt ?? null,
        endDate: coupon.expiresAt ?? null,
        status: coupon.isActive ? 'active' : 'inactive',
    };
};

const normalizeCouponPayload = (payload, { partial = false } = {}) => {
    const normalized = {};

    if (payload.code !== undefined) {
        const code = String(payload.code || '').trim().toUpperCase();
        if (!code) throw new ApiError(400, 'Coupon code is required');
        normalized.code = code;
    } else if (!partial) {
        throw new ApiError(400, 'Coupon code is required');
    }

    if (payload.name !== undefined) {
        normalized.name = String(payload.name || '').trim();
    }

    if (payload.type !== undefined) {
        const type = String(payload.type || '').trim().toLowerCase();
        if (!COUPON_TYPES.has(type)) {
            throw new ApiError(400, 'Coupon type must be percentage, fixed, or freeship');
        }
        normalized.type = type;
    } else if (!partial) {
        throw new ApiError(400, 'Coupon type is required');
    }

    if (payload.value !== undefined) {
        const value = toFiniteNumber(payload.value);
        if (value === null || value < 0) throw new ApiError(400, 'Coupon value must be a non-negative number');
        normalized.value = value;
    } else if (!partial) {
        throw new ApiError(400, 'Coupon value is required');
    }

    if (payload.minOrderValue !== undefined || payload.minPurchase !== undefined) {
        const minOrderValue = payload.minOrderValue ?? payload.minPurchase;
        const parsed = toFiniteNumber(minOrderValue);
        if (parsed === null || parsed < 0) throw new ApiError(400, 'Minimum purchase must be a non-negative number');
        normalized.minOrderValue = parsed;
    } else if (!partial) {
        normalized.minOrderValue = 0;
    }

    if (payload.maxDiscount !== undefined) {
        if (payload.maxDiscount === '' || payload.maxDiscount === null) {
            normalized.maxDiscount = null;
        } else {
            const maxDiscount = toFiniteNumber(payload.maxDiscount);
            if (maxDiscount === null || maxDiscount < 0) throw new ApiError(400, 'Max discount must be a non-negative number');
            normalized.maxDiscount = maxDiscount;
        }
    }

    if (payload.usageLimit !== undefined) {
        if (payload.usageLimit === '' || payload.usageLimit === null) {
            normalized.usageLimit = null;
        } else {
            const usageLimit = Number(payload.usageLimit);
            if (!Number.isInteger(usageLimit)) throw new ApiError(400, 'Usage limit must be an integer');
            normalized.usageLimit = usageLimit < 0 ? null : usageLimit;
        }
    }

    if (payload.isActive !== undefined) {
        const isActive = toBooleanOrNull(payload.isActive);
        if (isActive === null) throw new ApiError(400, 'isActive must be a boolean');
        normalized.isActive = isActive;
    } else if (payload.status !== undefined) {
        normalized.isActive = String(payload.status).toLowerCase() === 'active';
    } else if (!partial) {
        normalized.isActive = true;
    }

    if (payload.startsAt !== undefined || payload.startDate !== undefined) {
        const startsAt = toValidDateOrNull(payload.startsAt ?? payload.startDate);
        if ((payload.startsAt ?? payload.startDate) && !startsAt) throw new ApiError(400, 'Start date is invalid');
        normalized.startsAt = startsAt;
    }

    if (payload.expiresAt !== undefined || payload.endDate !== undefined) {
        const expiresAt = toValidDateOrNull(payload.expiresAt ?? payload.endDate);
        if ((payload.expiresAt ?? payload.endDate) && !expiresAt) throw new ApiError(400, 'End date is invalid');
        normalized.expiresAt = expiresAt;
    }

    return normalized;
};

const validateCouponBusinessRules = ({ type, value }) => {
    if (type === 'percentage') {
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue)) {
            throw new ApiError(400, 'Coupon value must be a valid number');
        }
        if (parsedValue > 100) {
            throw new ApiError(400, 'Percentage coupon value cannot exceed 100');
        }
    }
};

// ─── Coupons (Promo Codes) ──────────────────────────────────────────────────
export const getAllCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(Number.parseInt(limit, 10) || 10, 1);
    const now = new Date();
    const where = {};

    const Coupon = mongoose.model('Coupon');

    if (status === 'active') {
        where.isActive = true;
        where.$and = [
            { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
            { $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }] }
        ];
    } else if (status === 'inactive') {
        where.isActive = false;
    } else if (status === 'expired') {
        where.expiresAt = { $lt: now };
    } else if (status === 'upcoming') {
        where.startsAt = { $gt: now };
    }

    const [coupons, count] = await Promise.all([
        Coupon.find(where)
            .sort({ createdAt: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)
            .lean(),
        Coupon.countDocuments(where),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            coupons: coupons.map(formatCoupon),
            pagination: {
                total: count,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(count / parsedLimit)
            }
        }, 'Coupons fetched successfully')
    );
});

export const createCoupon = asyncHandler(async (req, res) => {
    const payload = normalizeCouponPayload(req.body);
    validateCouponBusinessRules({ type: payload.type, value: payload.value });

    const Coupon = mongoose.model('Coupon');

    if (payload.type === 'freeship') {
        payload.value = 0;
        payload.maxDiscount = null;
    }

    if (payload.startsAt && payload.expiresAt && payload.startsAt >= payload.expiresAt) {
        throw new ApiError(400, 'End date must be after start date');
    }

    const existingCoupon = await Coupon.findOne({ code: payload.code }).lean();
    if (existingCoupon) throw new ApiError(409, 'Coupon code already exists');

    const coupon = await Coupon.create(payload);
    return res.status(201).json(new ApiResponse(201, formatCoupon(coupon.toObject()), 'Coupon created successfully'));
});

export const updateCoupon = asyncHandler(async (req, res) => {
    const payload = normalizeCouponPayload(req.body, { partial: true });
    const Coupon = mongoose.model('Coupon');

    const coupon = await Coupon.findOne({ _id: req.params.id });
    if (!coupon) throw new ApiError(404, 'Coupon not found');

    const effectiveType = payload.type !== undefined ? payload.type : coupon.type;
    const effectiveValue = payload.value !== undefined ? payload.value : coupon.value;
    validateCouponBusinessRules({ type: effectiveType, value: effectiveValue });

    if (effectiveType === 'freeship') {
        payload.value = 0;
        payload.maxDiscount = null;
    }

    if (payload.code && payload.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: payload.code, _id: { $ne: coupon._id } }).lean();
        if (existingCoupon) throw new ApiError(409, 'Coupon code already exists');
    }

    const effectiveStart = payload.startsAt !== undefined ? payload.startsAt : coupon.startsAt;
    const effectiveEnd = payload.expiresAt !== undefined ? payload.expiresAt : coupon.expiresAt;
    if (effectiveStart && effectiveEnd && effectiveStart >= effectiveEnd) {
        throw new ApiError(400, 'End date must be after start date');
    }

    const updated = await Coupon.findOneAndUpdate(
        { _id: coupon._id },
        { $set: payload },
        { new: true }
    ).lean();

    return res.status(200).json(new ApiResponse(200, formatCoupon(updated), 'Coupon updated successfully'));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
    const Coupon = mongoose.model('Coupon');
    const existing = await Coupon.findOne({ _id: req.params.id }).lean();
    if (!existing) throw new ApiError(404, 'Coupon not found');

    await Coupon.deleteOne({ _id: req.params.id });
    return res.status(200).json(new ApiResponse(200, null, 'Coupon deleted successfully'));
});

// ─── Banners ──────────────────────────────────────────────────────────────────
export const getAllBanners = asyncHandler(async (req, res) => {
    const Banner = mongoose.model('Banner');
    const banners = await Banner.find({})
        .sort({ order: 1, createdAt: -1 })
        .lean();

    const mapped = banners.map(b => ({ ...b, id: String(b._id) }));
    return res.status(200).json(new ApiResponse(200, mapped, 'Banners fetched successfully'));
});

export const createBanner = asyncHandler(async (req, res) => {
    const Banner = mongoose.model('Banner');
    const banner = await Banner.create(normalizeBannerPayload(req.body));
    return res.status(201).json(new ApiResponse(201, { ...banner.toObject(), id: String(banner._id) }, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req, res) => {
    const Banner = mongoose.model('Banner');
    const existing = await Banner.findOne({ _id: req.params.id }).lean();
    if (!existing) throw new ApiError(404, 'Banner not found');

    const banner = await Banner.findOneAndUpdate(
        { _id: req.params.id },
        { $set: normalizeBannerPayload(req.body) },
        { new: true }
    ).lean();
    return res.status(200).json(new ApiResponse(200, { ...banner, id: String(banner._id) }, 'Banner updated successfully'));
});

export const reorderBanners = asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length < 2) {
        throw new ApiError(400, 'At least two banners are required for reorder');
    }

    const validItems = items.filter((item) => item?.id && Number.isFinite(Number(item?.order)));
    if (validItems.length < 2) {
        throw new ApiError(400, 'Invalid reorder payload');
    }

    const Banner = mongoose.model('Banner');

    await runInTransaction(async (session) => {
        for (const item of validItems) {
            await Banner.updateOne(
                { _id: String(item.id) },
                { $set: { order: Number(item.order) } },
                { session }
            );
        }
    });

    return res.status(200).json(new ApiResponse(200, null, 'Banners reordered successfully'));
});

export const deleteBanner = asyncHandler(async (req, res) => {
    const Banner = mongoose.model('Banner');
    const existing = await Banner.findOne({ _id: req.params.id }).lean();
    if (!existing) throw new ApiError(404, 'Banner not found');

    await Banner.deleteOne({ _id: req.params.id });
    return res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const getAllCampaigns = asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const Campaign = mongoose.model('Campaign');

    const campaigns = await Campaign.find(query)
        .sort({ createdAt: -1 })
        .lean();

    const mapped = campaigns.map(c => ({ ...c, id: String(c._id) }));
    return res.status(200).json(new ApiResponse(200, mapped, 'Campaigns fetched successfully'));
});

export const createCampaign = asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    const slugSource = payload.slug || payload.name;
    payload.slug = await ensureUniqueCampaignSlug(slugSource);
    payload.route = `/sale/${payload.slug}`;
    payload.productIds = normalizeObjectIdList(payload.productIds);

    const Campaign = mongoose.model('Campaign');

    const campaign = await Campaign.create(payload);
    await syncCampaignBanner(campaign.toObject());
    return res.status(201).json(new ApiResponse(201, { ...campaign.toObject(), id: String(campaign._id) }, 'Campaign created successfully'));
});

export const updateCampaign = asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const existing = await Campaign.findOne({ _id: req.params.id }).lean();
    if (!existing) throw new ApiError(404, 'Campaign not found');

    const payload = { ...req.body };
    if (payload.name !== undefined || payload.slug !== undefined) {
        const slugSource = payload.slug || payload.name || existing.slug || existing.name;
        payload.slug = await ensureUniqueCampaignSlug(slugSource, existing._id);
    }
    payload.route = `/sale/${payload.slug || existing.slug}`;
    if (payload.productIds !== undefined) {
        payload.productIds = normalizeObjectIdList(payload.productIds);
    }

    const campaign = await Campaign.findOneAndUpdate(
        { _id: req.params.id },
        { $set: payload },
        { new: true }
    ).lean();

    if (campaign.autoCreateBanner) {
        await syncCampaignBanner(campaign, existing.route || null);
    } else {
        await deactivateCampaignBannersByRoutes([existing.route, campaign.route]);
    }

    return res.status(200).json(new ApiResponse(200, { ...campaign, id: String(campaign._id) }, 'Campaign updated successfully'));
});

export const deleteCampaign = asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const campaign = await Campaign.findOne({ _id: req.params.id }).lean();
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    await Campaign.deleteOne({ _id: req.params.id });
    await deactivateCampaignBannersByRoutes([campaign.route]);
    return res.status(200).json(new ApiResponse(200, null, 'Campaign deleted successfully'));
});
