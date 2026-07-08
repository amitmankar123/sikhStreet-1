import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';

// GET /api/admin/analytics/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    const Vendor = mongoose.model('Vendor');
    const Product = mongoose.model('Product');

    const [totalOrders, totalUsers, totalVendors, totalProducts, revenueAgg, pendingOrders] = await Promise.all([
        Order.countDocuments({ isDeleted: false }),
        User.countDocuments({ role: 'customer' }),
        Vendor.countDocuments({ status: 'approved' }),
        Product.countDocuments({ isActive: true }),
        Order.aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: { $ne: 'cancelled' },
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }
                }
            }
        ]),
        Order.countDocuments({
            isDeleted: false,
            status: 'pending',
        }),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    res.status(200).json(new ApiResponse(200, {
        totalOrders,
        totalUsers,
        totalVendors,
        totalProducts,
        totalRevenue,
        pendingOrders,
    }, 'Dashboard stats fetched.'));
});

// GET /api/admin/analytics/revenue
export const getRevenueData = asyncHandler(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const Order = mongoose.model('Order');

    const where = {
        isDeleted: false,
        status: { $ne: 'cancelled' },
    };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.$gte = new Date(startDate);
        if (endDate) where.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const orders = await Order.find(where)
        .select('createdAt total')
        .sort({ createdAt: 1 })
        .lean();

    const getGroupKey = (date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        if (period === 'daily') {
            return `${yyyy}-${mm}-${dd}`;
        } else if (period === 'weekly') {
            const onejan = new Date(yyyy, 0, 1);
            const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            return `${yyyy}-${String(week).padStart(2, '0')}`;
        } else {
            return `${yyyy}-${mm}`;
        }
    };

    const grouped = {};
    for (const order of orders) {
        const key = getGroupKey(order.createdAt);
        if (!grouped[key]) {
            grouped[key] = { _id: key, revenue: 0, orders: 0 };
        }
        grouped[key].revenue += order.total;
        grouped[key].orders += 1;
    }

    let result = Object.values(grouped);
    if (!startDate && !endDate) {
        result = result.slice(-12);
    }

    res.status(200).json(new ApiResponse(200, result, 'Revenue data fetched.'));
});

// GET /api/admin/analytics/order-status
export const getOrderStatusBreakdown = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');

    const breakdown = await Order.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = breakdown.map(item => ({
        status: item._id,
        count: item.count,
    })).sort((a, b) => b.count - a.count);

    res.status(200).json(new ApiResponse(200, result, 'Order status breakdown fetched.'));
});

// GET /api/admin/analytics/top-products
export const getTopProducts = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const Product = mongoose.model('Product');

    const orders = await Order.find({
        isDeleted: false,
        status: { $ne: 'cancelled' },
    }).select('items').lean();

    const productSales = {};
    for (const order of orders) {
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
            if (!item || !item.productId) continue;
            const pId = String(item.productId);
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || 0);
            if (!productSales[pId]) {
                productSales[pId] = { totalSold: 0, revenue: 0 };
            }
            productSales[pId].totalSold += qty;
            productSales[pId].revenue += qty * price;
        }
    }

    const sortedProducts = Object.keys(productSales)
        .map(id => ({
            id,
            totalSold: productSales[id].totalSold,
            revenue: productSales[id].revenue,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

    if (sortedProducts.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], 'Top products fetched.'));
    }

    const productIds = sortedProducts.map(p => p.id);
    const dbProducts = await Product.find({ _id: { $in: productIds } })
        .select('_id name image images')
        .lean();

    const productMap = {};
    for (const p of dbProducts) {
        productMap[String(p._id)] = p;
    }

    const result = sortedProducts.map(p => {
        const dbProd = productMap[p.id];
        let image = null;
        if (dbProd) {
            if (Array.isArray(dbProd.images) && dbProd.images.length > 0) {
                image = dbProd.images[0];
            } else {
                image = dbProd.image;
            }
        }
        return {
            _id: p.id,
            name: dbProd ? dbProd.name : 'Unknown Product',
            image: image,
            totalSold: p.totalSold,
            revenue: p.revenue,
        };
    });

    res.status(200).json(new ApiResponse(200, result, 'Top products fetched.'));
});

// GET /api/admin/analytics/customer-growth
export const getCustomerGrowth = asyncHandler(async (req, res) => {
    const { period = 'monthly' } = req.query;

    const User = mongoose.model('User');

    const users = await User.find({ role: 'customer' })
        .select('createdAt')
        .sort({ createdAt: 1 })
        .lean();

    const getGroupKey = (date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        if (period === 'daily') {
            return `${yyyy}-${mm}-${dd}`;
        } else if (period === 'weekly') {
            const onejan = new Date(yyyy, 0, 1);
            const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            return `${yyyy}-${String(week).padStart(2, '0')}`;
        } else {
            return `${yyyy}-${mm}`;
        }
    };

    const grouped = {};
    for (const u of users) {
        const key = getGroupKey(u.createdAt);
        if (!grouped[key]) {
            grouped[key] = { _id: key, newUsers: 0 };
        }
        grouped[key].newUsers += 1;
    }

    let result = Object.values(grouped);
    result.sort((a, b) => (a._id > b._id ? 1 : -1));
    result = result.slice(-12);

    res.status(200).json(new ApiResponse(200, result, 'Customer growth fetched.'));
});

// GET /api/admin/analytics/recent-orders
export const getRecentOrders = asyncHandler(async (req, res) => {
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const dbOrders = await Order.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const userIds = [...new Set(dbOrders.map(o => o.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();

    const orders = dbOrders.map(order => {
        const user = users.find(u => String(u._id) === String(order.userId));
        return {
            ...order,
            id: String(order._id),
            userId: user ? { _id: user._id, id: String(user._id), name: user.name, email: user.email } : null
        };
    });

    res.status(200).json(new ApiResponse(200, orders, 'Recent orders fetched.'));
});

// GET /api/admin/analytics/sales
export const getSalesData = asyncHandler(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const Order = mongoose.model('Order');

    const where = {
        isDeleted: false,
        status: { $ne: 'cancelled' },
    };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.$gte = new Date(startDate);
        if (endDate) where.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const orders = await Order.find(where)
        .select('createdAt total')
        .sort({ createdAt: 1 })
        .lean();

    const getGroupKey = (date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        if (period === 'daily') {
            return `${yyyy}-${mm}-${dd}`;
        } else if (period === 'weekly') {
            const onejan = new Date(yyyy, 0, 1);
            const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            return `${yyyy}-${String(week).padStart(2, '0')}`;
        } else {
            return `${yyyy}-${mm}`;
        }
    };

    const grouped = {};
    for (const order of orders) {
        const key = getGroupKey(order.createdAt);
        if (!grouped[key]) {
            grouped[key] = { _id: key, sales: 0, orders: 0 };
        }
        grouped[key].sales += order.total;
        grouped[key].orders += 1;
    }

    let result = Object.values(grouped);
    if (!startDate && !endDate) {
        result = result.slice(-12);
    }

    res.status(200).json(new ApiResponse(200, result, 'Sales data fetched.'));
});

// GET /api/admin/analytics/finance-summary
export const getFinancialSummary = asyncHandler(async (req, res) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const Order = mongoose.model('Order');

    const where = {
        isDeleted: false,
        status: { $ne: 'cancelled' },
    };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.$gte = new Date(startDate);
        if (endDate) where.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const orders = await Order.find(where)
        .select('createdAt total subtotal tax shipping discount')
        .sort({ createdAt: 1 })
        .lean();

    const getGroupKey = (date) => {
        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        if (period === 'daily') {
            return `${yyyy}-${mm}-${dd}`;
        } else if (period === 'weekly') {
            const onejan = new Date(yyyy, 0, 1);
            const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            return `${yyyy}-${String(week).padStart(2, '0')}`;
        } else {
            return `${yyyy}-${mm}`;
        }
    };

    const grouped = {};
    for (const order of orders) {
        const key = getGroupKey(order.createdAt);
        if (!grouped[key]) {
            grouped[key] = {
                _id: key,
                revenue: 0,
                subtotal: 0,
                tax: 0,
                delivery: 0,
                discount: 0,
                orders: 0,
            };
        }
        grouped[key].revenue += order.total;
        grouped[key].subtotal += order.subtotal;
        grouped[key].tax += order.tax;
        grouped[key].delivery += order.shipping;
        grouped[key].discount += order.discount;
        grouped[key].orders += 1;
    }

    let result = Object.values(grouped);
    if (!startDate && !endDate) {
        result = result.slice(-12);
    }

    res.status(200).json(new ApiResponse(200, result, 'Financial summary fetched.'));
});

// GET /api/admin/analytics/inventory-stats
export const getInventoryStats = asyncHandler(async (req, res) => {
    const Product = mongoose.model('Product');

    const [totalProducts, outOfStock, lowStock, activeProducts] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ stock: 'out_of_stock' }),
        Product.countDocuments({ stock: 'low_stock' }),
        Product.countDocuments({ isActive: true }),
    ]);

    res.status(200).json(new ApiResponse(200, {
        totalProducts,
        outOfStock,
        lowStock,
        activeProducts,
    }, 'Inventory stats fetched.'));
});
