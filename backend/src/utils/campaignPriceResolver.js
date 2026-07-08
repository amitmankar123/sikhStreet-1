import mongoose from 'mongoose';

/**
 * Dynamically applies active campaign discounts to a list of products and their variants.
 * @param {Array} products - Array of product lean documents/objects.
 * @returns {Promise<Array>} List of products with discounted prices.
 */
export const applyCampaignDiscountsToProducts = async (products) => {
    if (!Array.isArray(products) || products.length === 0) return products;
    
    const Campaign = mongoose.model('Campaign');
    const now = new Date();
    
    // Find all active campaigns
    const activeCampaigns = await Campaign.find({
        isActive: true,
        $and: [
            { $or: [ { startDate: null }, { startDate: { $lte: now } } ] },
            { $or: [ { endDate: null }, { endDate: { $gte: now } } ] }
        ]
    }).lean();

    if (activeCampaigns.length === 0) return products;

    return products.map(product => {
        const productIdStr = String(product._id || product.id);
        const matchingCampaign = activeCampaigns.find(c => 
            Array.isArray(c.productIds) && c.productIds.map(String).includes(productIdStr)
        );

        if (!matchingCampaign) return product;

        // Save original price as base for display
        const originalPrice = product.originalPrice && product.originalPrice > product.price 
            ? product.originalPrice 
            : product.price;

        let discountedPrice = product.price;
        if (matchingCampaign.discountType === 'percentage') {
            discountedPrice = Math.round(product.price * (1 - matchingCampaign.discountValue / 100));
        } else if (matchingCampaign.discountType === 'fixed') {
            discountedPrice = Math.max(0, product.price - matchingCampaign.discountValue);
        }

        // Apply campaign discount to variants if they exist
        const updatedVariants = product.variants ? { ...product.variants } : undefined;
        if (updatedVariants && updatedVariants.prices) {
            const updatedPrices = {};
            for (const [key, value] of Object.entries(updatedVariants.prices)) {
                const numericVal = Number(value);
                if (Number.isFinite(numericVal)) {
                    if (matchingCampaign.discountType === 'percentage') {
                        updatedPrices[key] = Math.round(numericVal * (1 - matchingCampaign.discountValue / 100));
                    } else if (matchingCampaign.discountType === 'fixed') {
                        updatedPrices[key] = Math.max(0, numericVal - matchingCampaign.discountValue);
                    }
                } else {
                    updatedPrices[key] = value;
                }
            }
            updatedVariants.prices = updatedPrices;
        }

        return {
            ...product,
            price: discountedPrice,
            originalPrice: originalPrice,
            variants: updatedVariants,
            campaignDiscountValue: matchingCampaign.discountValue,
            campaignDiscountType: matchingCampaign.discountType,
            campaignName: matchingCampaign.name,
            campaignSlug: matchingCampaign.slug
        };
    });
};
