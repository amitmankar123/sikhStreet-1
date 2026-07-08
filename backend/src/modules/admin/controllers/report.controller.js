import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';

// GET /api/admin/reports/sales
export const getSalesReport = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status = 'delivered',
        startDate,
        endDate,
        search
    } = req.query;

    const numericPage = Number.parseInt(page, 10) || 1;
    const numericLimit = Number.parseInt(limit, 10) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const filter = { isDeleted: false };
    if (status && status !== 'all') filter.status = status;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search) {
        filter.$or = [
            { orderId: { $regex: search, $options: 'i' } },
            { "shippingAddress.name": { $regex: search, $options: 'i' } },
            { "shippingAddress.email": { $regex: search, $options: 'i' } }
        ];
    }

    const [orders, total, totalsAgg] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Order.countDocuments(filter),
        Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();

    const mappedOrders = orders.map(order => {
        const user = users.find(u => String(u._id) === String(order.userId));
        return {
            ...order,
            id: String(order._id),
            userId: user ? {
                _id: user._id,
                id: String(user._id),
                name: user.name,
                email: user.email,
                phone: user.phone
            } : null
        };
    });

    const totalSales = totalsAgg[0]?.total || 0;
    const totalOrders = totalsAgg[0]?.count || 0;
    const summary = {
        totalSales,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                orders: mappedOrders,
                total,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
                summary,
            },
            'Sales report fetched.'
        )
    );
});

// GET /api/admin/reports/inventory
export const getInventoryReport = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search, status } = req.query;
    const numericPage = Number.parseInt(page, 10) || 1;
    const numericLimit = Number.parseInt(limit, 10) || 50;
    const skip = (numericPage - 1) * numericLimit;

    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Brand = mongoose.model('Brand');

    const filter = {};
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    if (status && status !== 'all') filter.stock = status;

    const [products, total, allMatchingProducts] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Product.countDocuments(filter),
        Product.find(filter)
            .select('_id isActive stock price stockQuantity')
            .lean()
    ]);

    const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
    const brandIds = [...new Set(products.map(p => p.brandId).filter(Boolean))];

    const [categories, brands] = await Promise.all([
        Category.find({ _id: { $in: categoryIds } }).select('name').lean(),
        Brand.find({ _id: { $in: brandIds } }).select('name').lean()
    ]);

    const mappedProducts = products.map(p => {
        const category = categories.find(c => String(c._id) === String(p.categoryId));
        const brand = brands.find(b => String(b._id) === String(p.brandId));
        return {
            ...p,
            id: String(p._id),
            categoryId: category ? { _id: category._id, id: String(category._id), name: category.name } : null,
            brandId: brand ? { _id: brand._id, id: String(brand._id), name: brand.name } : null
        };
    });

    let totalProducts = 0;
    let activeProducts = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    for (const p of allMatchingProducts) {
        totalProducts++;
        if (p.isActive !== false) activeProducts++;
        if (p.stock === 'low_stock') lowStock++;
        if (p.stock === 'out_of_stock') outOfStock++;
        totalValue += (p.price || 0) * (p.stockQuantity || 0);
    }

    const summary = {
        totalProducts,
        activeProducts,
        lowStock,
        outOfStock,
        totalValue,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            {
                products: mappedProducts,
                total,
                page: numericPage,
                pages: Math.ceil(total / numericLimit),
                summary,
            },
            'Inventory report fetched.'
        )
    );
});
