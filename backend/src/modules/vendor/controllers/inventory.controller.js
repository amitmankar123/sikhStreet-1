import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';

export const getInventoryReport = asyncHandler(async (req, res) => {
    const { lowStockOnly } = req.query;

    const Product = mongoose.model('Product');
    const Order = mongoose.model('Order');

    const products = await Product.find({ vendorId: req.user.id })
        .select('name price stockQuantity lowStockThreshold')
        .lean();

    const reportMap = {};
    for (const product of products) {
        const id = String(product._id);
        const stockQuantity = Number(product.stockQuantity || 0);
        const price = Number(product.price || 0);
        const lowStockThreshold = Number(product.lowStockThreshold || 10);
        reportMap[id] = {
            id,
            name: product.name,
            currentStock: stockQuantity,
            price,
            stockValue: stockQuantity * price,
            sold: 0,
            lowStockThreshold,
        };
    }

    const orders = await Order.find({
        "vendorItems.vendorId": req.user.id,
        status: { $nin: ['cancelled', 'returned'] },
        isDeleted: false,
    }).select('vendorItems').lean();

    for (const order of orders) {
        const vendorItemsArray = Array.isArray(order.vendorItems) ? order.vendorItems : [];
        for (const vendorItem of vendorItemsArray) {
            if (String(vendorItem.vendorId) !== String(req.user.id)) continue;
            if (String(vendorItem.status).toLowerCase() === 'cancelled') continue;

            const items = Array.isArray(vendorItem.items) ? vendorItem.items : [];
            for (const item of items) {
                const productId = String(item.productId || '');
                if (!productId || !reportMap[productId]) continue;
                reportMap[productId].sold += Number(item.quantity || 1);
            }
        }
    }

    let rows = Object.values(reportMap);
    if (String(lowStockOnly).toLowerCase() === 'true') {
        rows = rows.filter(
            (row) => row.currentStock <= Number(row.lowStockThreshold || 10)
        );
    }

    rows.sort((a, b) => a.name.localeCompare(b.name));

    const summary = {
        totalProducts: rows.length,
        totalStockValue: rows.reduce((sum, row) => sum + row.stockValue, 0),
        totalUnitsSold: rows.reduce((sum, row) => sum + row.sold, 0),
        lowStockItems: rows.filter(
            (row) =>
                row.currentStock > 0 &&
                row.currentStock <= Number(row.lowStockThreshold || 10)
        ).length,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            { rows, summary },
            'Inventory report fetched.'
        )
    );
});
