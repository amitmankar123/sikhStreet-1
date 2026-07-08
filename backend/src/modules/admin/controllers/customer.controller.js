import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

/**
 * @desc    Get all customers with pagination and filters
 * @route   GET /api/admin/customers
 * @access  Private (Admin)
 */
export const getAllCustomers = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 10 } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 10;
    const skip = (numericPage - 1) * numericLimit;

    const User = mongoose.model('User');
    const Order = mongoose.model('Order');
    const Address = mongoose.model('Address');

    const filter = { role: 'customer' };

    if (status) {
        filter.isActive = status === 'active';
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const [customers, total] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        User.countDocuments(filter)
    ]);

    const customerIds = customers.map((customer) => String(customer._id));

    const [orders, addressesByUser] = await Promise.all([
        Order.find({ userId: { $in: customerIds }, isDeleted: false })
            .select('userId total createdAt')
            .lean(),
        Address.find({ userId: { $in: customerIds } })
            .sort({ isDefault: -1, createdAt: -1 })
            .lean()
    ]);

    const statsMap = {};
    for (const id of customerIds) {
        statsMap[id] = { orders: 0, totalSpent: 0, lastOrderDate: null };
    }

    for (const order of orders) {
        if (!order.userId) continue;
        const stats = statsMap[String(order.userId)];
        if (stats) {
            stats.orders += 1;
            stats.totalSpent += order.total;
            if (!stats.lastOrderDate || order.createdAt > stats.lastOrderDate) {
                stats.lastOrderDate = order.createdAt;
            }
        }
    }

    const addressesMap = new Map();
    for (const address of addressesByUser) {
        const userId = String(address.userId);
        const existing = addressesMap.get(userId) || [];
        existing.push(address);
        addressesMap.set(userId, existing);
    }

    const customersWithStats = customers.map((customer) => {
        const customerIdStr = String(customer._id);
        const customerStats = statsMap[customerIdStr] || {
            orders: 0,
            totalSpent: 0,
            lastOrderDate: null,
        };

        const sanitized = { ...customer };
        delete sanitized.password;
        delete sanitized.otp;
        delete sanitized.otpExpiry;

        return {
            _id: customerIdStr,
            id: customerIdStr,
            ...sanitized,
            orders: customerStats.orders,
            totalSpent: customerStats.totalSpent,
            lastOrderDate: customerStats.lastOrderDate,
            addresses: (addressesMap.get(customerIdStr) || []).map(addr => ({ ...addr, id: String(addr._id) })),
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            customers: customersWithStats,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit)
            }
        }, 'Customers fetched successfully')
    );
});

/**
 * @desc    Get customer details with order summary
 * @route   GET /api/admin/customers/:id
 * @access  Private (Admin)
 */
export const getCustomerById = asyncHandler(async (req, res) => {
    const User = mongoose.model('User');
    const Order = mongoose.model('Order');
    const Address = mongoose.model('Address');

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();

    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    const [orders, addresses] = await Promise.all([
        Order.find({ userId: customer._id, isDeleted: false }).select('total createdAt').lean(),
        Address.find({ userId: customer._id }).sort({ isDefault: -1, createdAt: -1 }).lean()
    ]);

    const stats = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
        lastOrderDate: orders.length > 0 ? new Date(Math.max(...orders.map(o => o.createdAt.getTime()))) : null
    };

    const sanitized = { ...customer };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;

    res.status(200).json(
        new ApiResponse(200, {
            _id: String(customer._id),
            id: String(customer._id),
            ...sanitized,
            orders: stats.totalOrders,
            totalSpent: stats.totalSpent,
            lastOrderDate: stats.lastOrderDate,
            addresses: addresses.map(addr => ({ ...addr, id: String(addr._id) }))
        }, 'Customer details fetched successfully')
    );
});

/**
 * @desc    Toggle customer active status
 * @route   PATCH /api/admin/customers/:id/status
 * @access  Private (Admin)
 */
export const updateCustomerStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, 'isActive status must be a boolean');
    }

    const User = mongoose.model('User');

    const existing = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!existing) {
        throw new ApiError(404, 'Customer not found');
    }

    existing.isActive = isActive;
    await existing.save();

    const sanitized = { ...existing.toObject() };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;

    res.status(200).json(
        new ApiResponse(200, { _id: String(existing._id), id: String(existing._id), ...sanitized }, `Customer status updated to ${isActive ? 'active' : 'inactive'}`)
    );
});

/**
 * @desc    Update customer details
 * @route   PUT /api/admin/customers/:id
 * @access  Private (Admin)
 */
export const updateCustomerDetail = asyncHandler(async (req, res) => {
    throw new ApiError(403, 'Editing customer details (name and phone) is not allowed.');
});

/**
 * @desc    Delete a customer
 * @route   DELETE /api/admin/customers/:id
 * @access  Private (Admin)
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
    const User = mongoose.model('User');

    const existing = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
    if (!existing) {
        throw new ApiError(404, 'Customer not found');
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json(
        new ApiResponse(200, null, 'Customer deleted successfully')
    );
});

/**
 * @desc    Delete a customer address
 * @route   DELETE /api/admin/customers/:customerId/addresses/:addressId
 * @access  Private (Admin)
 */
export const deleteCustomerAddress = asyncHandler(async (req, res) => {
    const { customerId, addressId } = req.params;

    const User = mongoose.model('User');
    const Address = mongoose.model('Address');

    const customer = await User.findOne({ _id: customerId, role: 'customer' }).select('_id').lean();
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    const address = await Address.findOne({ _id: addressId, userId: customerId }).lean();
    if (!address) {
        throw new ApiError(404, 'Address not found');
    }

    await Address.deleteOne({ _id: addressId });

    res.status(200).json(
        new ApiResponse(200, null, 'Address deleted successfully')
    );
});

/**
 * @desc    Get customer orders (paginated)
 * @route   GET /api/admin/customers/:id/orders
 * @access  Private (Admin)
 */
export const getCustomerOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const User = mongoose.model('User');
    const Order = mongoose.model('Order');

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
    if (!customer) {
        throw new ApiError(404, 'Customer not found');
    }

    const filter = {
        userId: String(customer._id),
        isDeleted: false,
    };

    if (status) {
        filter.status = status;
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    const mappedOrders = orders.map((order) => {
        return {
            ...order,
            id: String(order._id),
            userId: {
                _id: customer._id,
                id: String(customer._id),
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            orders: mappedOrders,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit),
            },
        }, 'Customer orders fetched successfully')
    );
});

/**
 * @desc    Get customer transactions (paginated)
 * @route   GET /api/admin/customers/transactions
 * @access  Private (Admin)
 */
export const getCustomerTransactions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, status = 'all' } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const Order = mongoose.model('Order');
    const User = mongoose.model('User');

    const filter = {
        userId: { $ne: null },
        isDeleted: false,
    };

    if (status === 'completed') {
        filter.$or = [
            { paymentStatus: 'paid' },
            { paymentStatus: 'refunded' }
        ];
    } else if (status === 'pending') {
        filter.paymentStatus = 'pending';
        filter.status = { $ne: 'cancelled' };
    } else if (status === 'failed') {
        filter.$or = [
            { paymentStatus: 'failed' },
            { status: 'cancelled' }
        ];
    }

    if (search) {
        const matchedUsers = await User.find({
            role: 'customer',
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        }).select('_id').limit(300).lean();
        const matchedUserIds = matchedUsers.map((u) => String(u._id));

        const searchOr = [
            { orderId: { $regex: search, $options: 'i' } }
        ];

        if (matchedUserIds.length > 0) {
            searchOr.push({ userId: { $in: matchedUserIds } });
        }

        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: searchOr }
            ];
            delete filter.$or;
        } else {
            filter.$or = searchOr;
        }
    }

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Order.countDocuments(filter),
    ]);

    const userIds = [...new Set(orders.map(o => o.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();

    const mappedOrders = orders.map((order) => {
        const user = users.find(u => String(u._id) === String(order.userId));
        return {
            ...order,
            id: String(order._id),
            userId: user ? {
                _id: user._id,
                id: String(user._id),
                name: user.name,
                email: user.email
            } : null
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            orders: mappedOrders,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit),
            },
        }, 'Customer transactions fetched successfully')
    );
});

/**
 * @desc    Get customer addresses (paginated)
 * @route   GET /api/admin/customers/addresses
 * @access  Private (Admin)
 */
export const getCustomerAddresses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;
    const skip = (numericPage - 1) * numericLimit;

    const User = mongoose.model('User');
    const Address = mongoose.model('Address');

    const customerUsers = await User.find({ role: 'customer' }).select('_id name email').lean();
    const allCustomerIds = customerUsers.map(u => String(u._id));

    const filter = {};
    let userIds = [];

    if (search) {
        const matchedUsers = await User.find({
            role: 'customer',
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }).select('_id').lean();
        userIds = matchedUsers.map(u => String(u._id));

        const validUserIds = userIds.filter(id => allCustomerIds.includes(id));

        filter.$or = [
            { address: { $regex: search, $options: 'i' } },
            { city: { $regex: search, $options: 'i' } },
            ...(validUserIds.length > 0 ? [{ userId: { $in: validUserIds } }] : [])
        ];
        filter.userId = { $in: allCustomerIds };
    } else {
        filter.userId = { $in: allCustomerIds };
    }

    const [dbAddresses, total] = await Promise.all([
        Address.find(filter)
            .sort({ isDefault: -1, createdAt: -1 })
            .skip(skip)
            .limit(numericLimit)
            .lean(),
        Address.countDocuments(filter)
    ]);

    const addresses = dbAddresses.map((addr) => {
        const user = customerUsers.find(u => String(u._id) === String(addr.userId));
        return {
            _id: String(addr._id),
            id: String(addr._id),
            userId: String(addr.userId),
            name: addr.name,
            fullName: addr.fullName,
            phone: addr.phone,
            address: addr.address,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
            isDefault: addr.isDefault,
            createdAt: addr.createdAt,
            updatedAt: addr.updatedAt,
            customerId: user ? String(user._id) : null,
            customerName: user ? user.name : null,
            customerEmail: user ? user.email : null
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            addresses,
            pagination: {
                total,
                page: numericPage,
                limit: numericLimit,
                pages: Math.ceil(total / numericLimit),
            },
        }, 'Customer addresses fetched successfully')
    );
});
