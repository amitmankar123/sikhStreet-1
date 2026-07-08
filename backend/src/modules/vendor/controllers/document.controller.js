import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import {
    uploadLocalFileToCloudinaryAndCleanupWithType,
    deleteFromCloudinary,
    cleanupLocalFiles,
} from '../../../services/upload.service.js';
import { createNotification } from '../../../services/notification.service.js';

const ALLOWED_CATEGORIES = new Set([
    'License',
    'Certificate',
    'Tax Document',
    'Other',
]);

export const getVendorDocuments = asyncHandler(async (req, res) => {
    const VendorDocument = mongoose.model('VendorDocument');
    const documents = await VendorDocument.find({ vendorId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();

    const mapped = documents.map(d => ({ ...d, id: String(d._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Documents fetched.'));
});

export const createVendorDocument = asyncHandler(async (req, res) => {
    const VendorDocument = mongoose.model('VendorDocument');

    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || 'Other').trim();
    const expiryDateRaw = req.body?.expiryDate;

    if (!name) throw new ApiError(400, 'Document name is required.');
    if (!ALLOWED_CATEGORIES.has(category)) {
        throw new ApiError(400, 'Invalid document category.');
    }
    if (!req.file?.path) throw new ApiError(400, 'Document file is required.');

    let expiryDate = null;
    if (expiryDateRaw) {
        const parsed = new Date(expiryDateRaw);
        if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'Invalid expiry date.');
        expiryDate = parsed;
    }

    let uploaded = null;
    try {
        uploaded = await uploadLocalFileToCloudinaryAndCleanupWithType(
            req.file.path,
            'vendors/documents',
            'auto'
        );

        const document = await VendorDocument.create({
            vendorId: req.user.id,
            name,
            category,
            expiryDate,
            status: 'pending',
            fileUrl: uploaded.url,
            filePublicId: uploaded.publicId,
            fileName: req.file.originalname || name,
            fileType: req.file.mimetype || 'application/octet-stream',
            fileSize: req.file.size || 0,
            uploadedAt: new Date(),
        });

        await createNotification({
            recipientId: req.user.id,
            recipientType: 'vendor',
            title: 'Document uploaded',
            message: `${name} uploaded successfully and is pending review.`,
            type: 'system',
            data: {
                documentId: String(document._id),
                category: String(category),
                status: 'pending',
            },
        });

        res.status(201).json(new ApiResponse(201, { ...document.toObject(), id: String(document._id) }, 'Document uploaded.'));
    } catch (error) {
        if (!uploaded) {
            await cleanupLocalFiles([req.file?.path]);
        }
        if (uploaded?.publicId) {
            await deleteFromCloudinary(uploaded.publicId).catch(() => null);
        }
        throw error;
    }
});

export const deleteVendorDocument = asyncHandler(async (req, res) => {
    const VendorDocument = mongoose.model('VendorDocument');

    const document = await VendorDocument.findOne({
        _id: req.params.id,
        vendorId: req.user.id
    });
    if (!document) throw new ApiError(404, 'Document not found.');

    await VendorDocument.deleteOne({ _id: document._id });

    if (document.filePublicId) {
        await deleteFromCloudinary(document.filePublicId).catch(() => null);
    }

    res.status(200).json(new ApiResponse(200, null, 'Document deleted.'));
});
