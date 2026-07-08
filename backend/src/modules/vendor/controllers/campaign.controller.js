import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

/**
 * GET /api/vendor/campaigns
 * Get active and upcoming campaigns.
 */
export const getVendorCampaigns = asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const Category = mongoose.model('Category');

    const now = new Date();
    // Retrieve campaigns that are active or upcoming (not ended yet)
    const campaigns = await Campaign.find({
        isActive: true,
        $or: [
            { endDate: null },
            { endDate: { $gte: now } }
        ]
    }).lean();

    const categoryIds = campaigns.map(c => c.categoryId).filter(Boolean);
    const categories = await Category.find({ _id: { $in: categoryIds } }).select('name').lean();

    const result = campaigns.map(c => {
        const cat = categories.find(cat => String(cat._id) === String(c.categoryId));
        return {
            ...c,
            id: c._id,
            categoryName: cat ? cat.name : 'All Categories',
        };
    });

    res.status(200).json(new ApiResponse(200, result, 'Vendor campaigns fetched.'));
});

/**
 * GET /api/vendor/campaigns/:id/products
 * Get campaign details, vendor's eligible products in the campaign category, and currently selected ones.
 */
export const getVendorCampaignProducts = asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const Product = mongoose.model('Product');

    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    // Find all active products of this vendor that match the campaign's category
    const availableProducts = await Product.find({
        vendorId: req.user.id,
        categoryId: campaign.categoryId,
        isActive: true
    }).lean();

    // Map which product IDs are currently in campaign's productIds
    const campaignProductIds = Array.isArray(campaign.productIds) ? campaign.productIds.map(String) : [];
    const selectedProductIds = availableProducts
        .filter(p => campaignProductIds.includes(String(p._id)))
        .map(p => String(p._id));

    res.status(200).json(new ApiResponse(200, {
        campaign: {
            ...campaign,
            id: campaign._id,
        },
        availableProducts: availableProducts.map(p => ({
            ...p,
            id: p._id
        })),
        selectedProductIds
    }, 'Vendor campaign products fetched.'));
});

/**
 * POST /api/vendor/campaigns/:id/products
 * Update vendor's products in the campaign.
 */
export const updateVendorCampaignProducts = asyncHandler(async (req, res) => {
    const Campaign = mongoose.model('Campaign');
    const Product = mongoose.model('Product');

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) throw new ApiError(404, 'Campaign not found');

    const { productIds: incomingIds = [] } = req.body;
    const newSelectedIds = incomingIds.map(String);

    // Get all products of this vendor matching the campaign category
    const vendorProducts = await Product.find({
        vendorId: req.user.id,
        categoryId: campaign.categoryId,
        isActive: true
    }).select('_id').lean();

    const vendorProductIds = vendorProducts.map(p => String(p._id));

    // Filter incomingIds to only allow products belonging to this vendor and matching the category
    const validNewIds = newSelectedIds.filter(id => vendorProductIds.includes(id));

    // Get current campaign productIds
    let currentProductIds = Array.isArray(campaign.productIds) ? campaign.productIds.map(String) : [];

    // Remove all products of THIS vendor from currentProductIds
    currentProductIds = currentProductIds.filter(id => !vendorProductIds.includes(id));

    // Append the validNewIds
    const updatedProductIds = [...new Set([...currentProductIds, ...validNewIds])];

    campaign.productIds = updatedProductIds;
    await campaign.save();

    // Sync the campaign banner!
    const Banner = mongoose.model('Banner');
    if (campaign.autoCreateBanner) {
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
            isActive: campaign.isActive && updatedProductIds.length > 0, // Banner is visible only if there's at least 1 product!
        };
        if (image) {
            bannerPayload.image = image;
        }

        const baseFilter = { type: 'promotional', link: campaign.route };
        const existing = await Banner.findOne(baseFilter).lean();
        if (existing) {
            await Banner.updateOne(
                { _id: existing._id },
                { $set: bannerPayload }
            );
        } else if (bannerPayload.image) {
            await Banner.create({
                ...bannerPayload,
                image: bannerPayload.image || ''
            });
        }
    }

    res.status(200).json(new ApiResponse(200, {
        id: campaign._id,
        productIds: updatedProductIds
    }, 'Campaign products updated successfully'));
});
