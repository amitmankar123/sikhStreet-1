import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

/**
 * @desc    Get all support tickets with filtering and pagination
 * @route   GET /api/admin/support/tickets
 * @access  Private (Admin)
 */
export const getAllTickets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status, priority } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const SupportTicket = mongoose.model('SupportTicket');
    const User = mongoose.model('User');
    const Vendor = mongoose.model('Vendor');
    const TicketType = mongoose.model('TicketType');

    const filter = {};

    if (status && status !== 'all') {
        filter.status = status;
    }

    if (priority && priority !== 'all') {
        filter.priority = priority;
    }

    if (search) {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search);
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(search);
        filter.$or = [
            { subject: { $regex: search, $options: 'i' } },
            ...(isUuid || isObjectId ? [{ _id: search }] : [])
        ];
    }

    const [tickets, total] = await Promise.all([
        SupportTicket.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean(),
        SupportTicket.countDocuments(filter)
    ]);

    const userIds = [...new Set(tickets.map(t => t.userId).filter(Boolean))];
    const vendorIds = [...new Set(tickets.map(t => t.vendorId).filter(Boolean))];
    const ticketTypeIds = [...new Set(tickets.map(t => t.ticketTypeId).filter(Boolean))];

    const [users, vendors, ticketTypes] = await Promise.all([
        User.find({ _id: { $in: userIds } }).select('name email phone').lean(),
        Vendor.find({ _id: { $in: vendorIds } }).select('storeName email').lean(),
        TicketType.find({ _id: { $in: ticketTypeIds } }).select('name').lean()
    ]);

    const normalizedTickets = tickets.map(ticket => {
        const user = users.find(u => String(u._id) === String(ticket.userId));
        const vendor = vendors.find(v => String(v._id) === String(ticket.vendorId));
        const ticketType = ticketTypes.find(t => String(t._id) === String(ticket.ticketTypeId));

        return {
            ...ticket,
            id: String(ticket._id),
            customer: user ? {
                name: user.name,
                email: user.email,
                phone: user.phone
            } : (vendor ? {
                name: vendor.storeName,
                email: vendor.email
            } : { name: 'Anonymous' }),
            category: ticketType ? ticketType.name : 'General',
            lastUpdate: ticket.updatedAt
        };
    });

    res.status(200).json(
        new ApiResponse(200, {
            tickets: normalizedTickets,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                pages: Math.ceil(total / limitNumber)
            }
        }, 'Support tickets fetched successfully')
    );
});

/**
 * @desc    Get ticket details with messages
 * @route   GET /api/admin/support/tickets/:id
 * @access  Private (Admin)
 */
export const getTicketById = asyncHandler(async (req, res) => {
    const SupportTicket = mongoose.model('SupportTicket');
    const User = mongoose.model('User');
    const Vendor = mongoose.model('Vendor');
    const TicketType = mongoose.model('TicketType');

    const ticket = await SupportTicket.findOne({ _id: req.params.id }).lean();

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    const [user, vendor, ticketType] = await Promise.all([
        ticket.userId ? User.findOne({ _id: ticket.userId }).select('name email phone').lean() : null,
        ticket.vendorId ? Vendor.findOne({ _id: ticket.vendorId }).select('storeName email').lean() : null,
        ticket.ticketTypeId ? TicketType.findOne({ _id: ticket.ticketTypeId }).select('name').lean() : null
    ]);

    const normalized = {
        ...ticket,
        id: String(ticket._id),
        customer: user ? {
            name: user.name,
            email: user.email,
            phone: user.phone
        } : (vendor ? {
            name: vendor.storeName,
            email: vendor.email
        } : { name: 'Anonymous' }),
        category: ticketType ? ticketType.name : 'General'
    };

    res.status(200).json(
        new ApiResponse(200, normalized, 'Ticket details fetched successfully')
    );
});

/**
 * @desc    Update ticket status
 * @route   PATCH /api/admin/support/tickets/:id/status
 * @access  Private (Admin)
 */
export const updateTicketStatus = asyncHandler(async (req, res) => {
    const { status, priority } = req.body;
    const SupportTicket = mongoose.model('SupportTicket');

    const ticket = await SupportTicket.findOne({ _id: req.params.id });

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    res.status(200).json(
        new ApiResponse(200, { ...ticket.toObject(), id: String(ticket._id) }, 'Ticket status updated successfully')
    );
});

/**
 * @desc    Add message to ticket
 * @route   POST /api/admin/support/tickets/:id/messages
 * @access  Private (Admin)
 */
export const addTicketMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
        throw new ApiError(400, 'Message is required');
    }

    const SupportTicket = mongoose.model('SupportTicket');

    const ticket = await SupportTicket.findOne({ _id: req.params.id });

    if (!ticket) {
        throw new ApiError(404, 'Ticket not found');
    }

    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const newMessage = {
        senderId: String(req.user.id || req.user._id),
        senderType: 'admin',
        message: trimmedMessage,
        createdAt: new Date().toISOString()
    };
    messages.push(newMessage);

    let nextStatus = ticket.status;
    if (ticket.status === 'open') {
        nextStatus = 'in_progress';
    }

    ticket.messages = messages;
    ticket.status = nextStatus;
    await ticket.save();

    res.status(200).json(
        new ApiResponse(200, newMessage, 'Message added successfully')
    );
});

/**
 * @desc    Get all ticket types
 * @route   GET /api/admin/support/ticket-types
 * @access  Private (Admin)
 */
export const getAllTicketTypes = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const TicketType = mongoose.model('TicketType');
    const filter = {};

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const ticketTypes = await TicketType.find(filter).sort({ createdAt: -1 }).lean();

    const normalized = ticketTypes.map((type) => ({
        ...type,
        id: String(type._id),
        status: type.isActive ? 'active' : 'inactive',
    }));

    res.status(200).json(new ApiResponse(200, normalized, 'Ticket types fetched successfully'));
});

/**
 * @desc    Create ticket type
 * @route   POST /api/admin/support/ticket-types
 * @access  Private (Admin)
 */
export const createTicketType = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;
    const trimmedName = String(name || '').trim();

    if (!trimmedName) throw new ApiError(400, 'Ticket type name is required');

    const TicketType = mongoose.model('TicketType');

    const existing = await TicketType.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    }).lean();
    if (existing) throw new ApiError(409, 'Ticket type already exists');

    const ticketType = await TicketType.create({
        name: trimmedName,
        description: String(description || '').trim(),
        isActive: status ? status === 'active' : true,
    });

    res.status(201).json(
        new ApiResponse(
            201,
            { ...ticketType.toObject(), id: String(ticketType._id), status: ticketType.isActive ? 'active' : 'inactive' },
            'Ticket type created successfully'
        )
    );
});

/**
 * @desc    Update ticket type
 * @route   PUT /api/admin/support/ticket-types/:id
 * @access  Private (Admin)
 */
export const updateTicketType = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;
    const TicketType = mongoose.model('TicketType');

    const ticketType = await TicketType.findOne({ _id: req.params.id });

    if (!ticketType) throw new ApiError(404, 'Ticket type not found');

    if (name !== undefined) {
        const trimmedName = String(name || '').trim();
        if (!trimmedName) throw new ApiError(400, 'Ticket type name is required');

        const existing = await TicketType.findOne({
            _id: { $ne: req.params.id },
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
        }).lean();
        if (existing) throw new ApiError(409, 'Ticket type already exists');

        ticketType.name = trimmedName;
    }

    if (description !== undefined) {
        ticketType.description = String(description || '').trim();
    }

    if (status !== undefined) {
        ticketType.isActive = String(status).toLowerCase() === 'active';
    }

    await ticketType.save();

    res.status(200).json(
        new ApiResponse(
            200,
            { ...ticketType.toObject(), id: String(ticketType._id), status: ticketType.isActive ? 'active' : 'inactive' },
            'Ticket type updated successfully'
        )
    );
});

/**
 * @desc    Delete ticket type
 * @route   DELETE /api/admin/support/ticket-types/:id
 * @access  Private (Admin)
 */
export const deleteTicketType = asyncHandler(async (req, res) => {
    const TicketType = mongoose.model('TicketType');

    const ticketType = await TicketType.findOne({ _id: req.params.id });
    if (!ticketType) throw new ApiError(404, 'Ticket type not found');

    await TicketType.deleteOne({ _id: req.params.id });

    res.status(200).json(new ApiResponse(200, null, 'Ticket type deleted successfully'));
});
