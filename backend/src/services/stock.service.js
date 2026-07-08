import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

/**
 * Validate and deduct stock for order items
 * @param {Array} items - [{ productId, quantity }]
 * @returns {Array} enriched items with product data
 */
export const validateAndDeductStock = async (items) => {
    const Product = mongoose.model('Product');
    const enriched = [];

    for (const item of items) {
        const product = await Product.findOne({ _id: item.productId });
        if (!product) throw new ApiError(404, `Product not found: ${item.productId}`);
        if (product.stock === 'out_of_stock') throw new ApiError(400, `${product.name} is out of stock.`);
        if (product.stockQuantity < item.quantity) throw new ApiError(400, `Only ${product.stockQuantity} units of ${product.name} available.`);

        const nextQty = product.stockQuantity - item.quantity;
        let nextStock = 'in_stock';
        if (nextQty <= 0) nextStock = 'out_of_stock';
        else if (nextQty <= product.lowStockThreshold) nextStock = 'low_stock';

        product.stockQuantity = nextQty;
        product.stock = nextStock;
        const updatedProduct = await product.save();

        enriched.push({ ...item, product: updatedProduct.toObject() });
    }

    return enriched;
};

/**
 * Restore stock when an order is cancelled
 */
export const restoreStock = async (items) => {
    const Product = mongoose.model('Product');
    for (const item of items) {
        const product = await Product.findOne({ _id: item.productId });
        if (!product) continue;

        const nextQty = product.stockQuantity + item.quantity;
        let nextStock = 'in_stock';
        if (nextQty <= 0) nextStock = 'out_of_stock';
        else if (nextQty <= product.lowStockThreshold) nextStock = 'low_stock';

        product.stockQuantity = nextQty;
        product.stock = nextStock;
        await product.save();
    }
};
