import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

const sanitizeCountries = (countries) => {
    if (!Array.isArray(countries)) return [];
    return countries
        .map((country) => String(country || '').trim())
        .filter(Boolean);
};

const parseNonNegativeNumber = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new ApiError(400, `${fieldName} must be a non-negative number.`);
    }
    return parsed;
};

export const getShippingZones = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const zones = await VendorShippingZone.find({ vendorId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

    const mappedZones = zones.map(z => ({ ...z, id: String(z._id) }));
    res.status(200).json(new ApiResponse(200, mappedZones, 'Shipping zones fetched.'));
});

export const createShippingZone = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const name = String(req.body?.name || '').trim();
    if (!name) throw new ApiError(400, 'Zone name is required.');

    const zone = await VendorShippingZone.create({
        vendorId: req.user.id,
        name,
        countries: sanitizeCountries(req.body?.countries),
    });

    res.status(201).json(new ApiResponse(201, { ...zone.toObject(), id: String(zone._id) }, 'Shipping zone created.'));
});

export const updateShippingZone = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const existing = await VendorShippingZone.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Shipping zone not found.');

    const data = {};
    if (req.body?.name !== undefined) {
        const name = String(req.body.name || '').trim();
        if (!name) throw new ApiError(400, 'Zone name is required.');
        data.name = name;
    }

    if (req.body?.countries !== undefined) {
        data.countries = sanitizeCountries(req.body.countries);
    }

    const updated = await VendorShippingZone.findOneAndUpdate(
        { _id: existing._id },
        { $set: data },
        { new: true }
    ).lean();

    res.status(200).json(new ApiResponse(200, { ...updated, id: String(updated._id) }, 'Shipping zone updated.'));
});

export const deleteShippingZone = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const VendorShippingRate = mongoose.model('VendorShippingRate');

    const existing = await VendorShippingZone.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Shipping zone not found.');

    await VendorShippingZone.deleteOne({ _id: existing._id });
    await VendorShippingRate.deleteMany({ vendorId: req.user.id, zoneId: String(existing._id) });

    res.status(200).json(new ApiResponse(200, null, 'Shipping zone deleted.'));
});

export const getShippingRates = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const VendorShippingRate = mongoose.model('VendorShippingRate');

    const rates = await VendorShippingRate.find({ vendorId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

    const zoneIds = [...new Set(rates.map(r => r.zoneId).filter(Boolean))];
    const zones = await VendorShippingZone.find({ _id: { $in: zoneIds } }).select('name').lean();

    const mappedRates = rates.map((rateDoc) => {
        const zone = zones.find(z => String(z._id) === String(rateDoc.zoneId));
        return {
            ...rateDoc,
            id: String(rateDoc._id),
            zoneName: zone?.name || '',
        };
    });

    res.status(200).json(new ApiResponse(200, mappedRates, 'Shipping rates fetched.'));
});

export const createShippingRate = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const VendorShippingRate = mongoose.model('VendorShippingRate');

    const zoneId = String(req.body?.zoneId || '').trim();
    const name = String(req.body?.name || '').trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!zoneId || (!uuidRegex.test(zoneId) && !/^[a-fA-F0-9]{24}$/.test(zoneId))) {
        throw new ApiError(400, 'Valid zone is required.');
    }
    if (!name) throw new ApiError(400, 'Rate method name is required.');

    const zone = await VendorShippingZone.findOne({ _id: zoneId, vendorId: req.user.id }).lean();
    if (!zone) throw new ApiError(404, 'Shipping zone not found.');

    const rate = await VendorShippingRate.create({
        vendorId: req.user.id,
        zoneId,
        name,
        rate: parseNonNegativeNumber(req.body?.rate ?? 0, 'Rate'),
        freeShippingThreshold: parseNonNegativeNumber(
            req.body?.freeShippingThreshold ?? 0,
            'Free shipping threshold'
        ),
    });

    const payload = {
        ...rate.toObject(),
        id: String(rate._id),
        zoneName: zone.name || '',
    };

    res.status(201).json(new ApiResponse(201, payload, 'Shipping rate created.'));
});

export const updateShippingRate = asyncHandler(async (req, res) => {
    const VendorShippingZone = mongoose.model('VendorShippingZone');
    const VendorShippingRate = mongoose.model('VendorShippingRate');

    const existing = await VendorShippingRate.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Shipping rate not found.');

    const data = {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    let targetZone = null;
    if (req.body?.zoneId !== undefined) {
        const zoneId = String(req.body.zoneId || '').trim();
        if (!zoneId || (!uuidRegex.test(zoneId) && !/^[a-fA-F0-9]{24}$/.test(zoneId))) {
            throw new ApiError(400, 'Valid zone is required.');
        }
        const zone = await VendorShippingZone.findOne({ _id: zoneId, vendorId: req.user.id }).lean();
        if (!zone) throw new ApiError(404, 'Shipping zone not found.');
        data.zoneId = zoneId;
        targetZone = zone;
    } else {
        targetZone = await VendorShippingZone.findOne({ _id: existing.zoneId }).lean();
    }

    if (req.body?.name !== undefined) {
        const name = String(req.body.name || '').trim();
        if (!name) throw new ApiError(400, 'Rate method name is required.');
        data.name = name;
    }

    if (req.body?.rate !== undefined) {
        data.rate = parseNonNegativeNumber(req.body.rate, 'Rate');
    }

    if (req.body?.freeShippingThreshold !== undefined) {
        data.freeShippingThreshold = parseNonNegativeNumber(
            req.body.freeShippingThreshold,
            'Free shipping threshold'
        );
    }

    const updated = await VendorShippingRate.findOneAndUpdate(
        { _id: existing._id },
        { $set: data },
        { new: true }
    ).lean();

    const payload = {
        ...updated,
        id: String(updated._id),
        zoneName: targetZone?.name || '',
    };

    res.status(200).json(new ApiResponse(200, payload, 'Shipping rate updated.'));
});

export const deleteShippingRate = asyncHandler(async (req, res) => {
    const VendorShippingRate = mongoose.model('VendorShippingRate');

    const existing = await VendorShippingRate.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!existing) throw new ApiError(404, 'Shipping rate not found.');

    await VendorShippingRate.deleteOne({ _id: existing._id });

    res.status(200).json(new ApiResponse(200, null, 'Shipping rate deleted.'));
});
