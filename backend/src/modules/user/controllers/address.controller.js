import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

const toTrimmed = (value) => String(value ?? '').trim();
const toPhone = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);

const buildAddressPayload = (input = {}) => ({
    name: toTrimmed(input.name),
    fullName: toTrimmed(input.fullName),
    phone: toPhone(input.phone),
    address: toTrimmed(input.address),
    city: toTrimmed(input.city),
    state: toTrimmed(input.state),
    zipCode: toTrimmed(input.zipCode),
    country: toTrimmed(input.country),
});

// GET /api/user/addresses
export const getAddresses = asyncHandler(async (req, res) => {
    const Address = mongoose.model('Address');
    const addresses = await Address.find({ userId: req.user.id })
        .sort({ isDefault: -1 })
        .lean();

    const mapped = addresses.map(a => ({ ...a, id: String(a._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Addresses fetched.'));
});

// POST /api/user/addresses
export const addAddress = asyncHandler(async (req, res) => {
    const { isDefault } = req.body;
    const payload = buildAddressPayload(req.body);

    const Address = mongoose.model('Address');

    const existingCount = await Address.countDocuments({ userId: req.user.id });
    const makeDefault = existingCount === 0 || Boolean(isDefault);

    // If new address is default, unset all others
    if (makeDefault) {
        await Address.updateMany(
            { userId: req.user.id },
            { $set: { isDefault: false } }
        );
    }

    const newAddress = await Address.create({
        userId: req.user.id,
        ...payload,
        isDefault: makeDefault,
    });

    res.status(201).json(new ApiResponse(201, { ...newAddress.toObject(), id: String(newAddress._id) }, 'Address added.'));
});

// PUT /api/user/addresses/:id
export const updateAddress = asyncHandler(async (req, res) => {
    const Address = mongoose.model('Address');

    const addr = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!addr) throw new ApiError(404, 'Address not found.');

    if (req.body.isDefault === true) {
        await Address.updateMany(
            { userId: req.user.id },
            { $set: { isDefault: false } }
        );
    }

    const payload = {};
    const allowedFields = ['name', 'fullName', 'phone', 'address', 'city', 'state', 'zipCode', 'country', 'isDefault'];
    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            if (field === 'phone') {
                payload.phone = toPhone(req.body.phone);
                return;
            }
            if (field === 'isDefault') {
                if (req.body.isDefault === true) {
                    payload.isDefault = true;
                }
                return;
            }
            payload[field] = toTrimmed(req.body[field]);
        }
    });

    Object.assign(addr, payload);
    await addr.save();

    res.status(200).json(new ApiResponse(200, { ...addr.toObject(), id: String(addr._id) }, 'Address updated.'));
});

// DELETE /api/user/addresses/:id
export const deleteAddress = asyncHandler(async (req, res) => {
    const Address = mongoose.model('Address');

    const addr = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!addr) throw new ApiError(404, 'Address not found.');

    await Address.deleteOne({ _id: req.params.id });

    if (addr.isDefault) {
        const nextAddress = await Address.findOne({ userId: req.user.id })
            .sort({ createdAt: -1 });
        if (nextAddress) {
            nextAddress.isDefault = true;
            await nextAddress.save();
        }
    }

    res.status(200).json(new ApiResponse(200, null, 'Address deleted.'));
});

// PATCH /api/user/addresses/:id/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
    const Address = mongoose.model('Address');

    const addr = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!addr) throw new ApiError(404, 'Address not found.');

    await Address.updateMany(
        { userId: req.user.id, _id: { $ne: addr._id } },
        { $set: { isDefault: false } }
    );

    let updated = addr;
    if (!addr.isDefault) {
        addr.isDefault = true;
        await addr.save();
        updated = addr;
    }

    res.status(200).json(new ApiResponse(200, { ...updated.toObject(), id: String(updated._id) }, 'Default address updated.'));
});
