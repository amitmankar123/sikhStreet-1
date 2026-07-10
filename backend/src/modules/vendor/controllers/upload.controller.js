import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';
import {
    uploadLocalFileToCloudinaryAndCleanup,
    deleteFromCloudinary,
    cleanupLocalFiles,
} from '../../../services/upload.service.js';

// POST /api/vendor/uploads/image
export const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, 'Image file is required');
    }

    const folder = (req.body?.folder || 'vendors/products').toString().trim() || 'vendors/products';
    const publicId = req.body?.publicId ? String(req.body.publicId).trim() : undefined;

    try {
        const uploaded = await uploadLocalFileToCloudinaryAndCleanup(req.file.path, folder, publicId);
        return res
            .status(201)
            .json(new ApiResponse(201, uploaded, 'Image uploaded successfully'));
    } catch (error) {
        await cleanupLocalFiles([req.file.path]);
        console.error("Cloudinary upload failed:", error);
        throw new ApiError(error.http_code || 500, error.message || 'Image upload failed');
    }
});

// POST /api/vendor/uploads/video
export const uploadVideo = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, 'Video file is required');
    }

    const folder = (req.body?.folder || 'vendors/products').toString().trim() || 'vendors/products';
    const publicId = req.body?.publicId ? String(req.body.publicId).trim() : undefined;

    try {
        const uploaded = await uploadLocalFileToCloudinaryAndCleanup(req.file.path, folder, publicId, 'video');
        return res
            .status(201)
            .json(new ApiResponse(201, uploaded, 'Video uploaded successfully'));
    } catch (error) {
        await cleanupLocalFiles([req.file.path]);
        console.error("Cloudinary upload failed:", error);
        throw new ApiError(error.http_code || 500, error.message || 'Video upload failed');
    }
});

// POST /api/vendor/uploads/images
export const uploadImages = asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (!Array.isArray(files) || files.length === 0) {
        throw new ApiError(400, 'At least one image file is required');
    }

    const folder = (req.body?.folder || 'vendors/products').toString().trim() || 'vendors/products';
    const settledUploads = await Promise.allSettled(
        files.map((file) => uploadLocalFileToCloudinaryAndCleanup(file.path, folder))
    );

    const successfulUploads = settledUploads
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value);
    const failedUploads = settledUploads.filter((item) => item.status === 'rejected');

    if (failedUploads.length > 0) {
        console.error('[uploadImages] Cloudinary upload failures:', failedUploads.map(f => f.reason));
        // Roll back successful Cloudinary uploads to keep this endpoint atomic.
        await Promise.allSettled(
            successfulUploads
                .map((upload) => upload?.publicId)
                .filter(Boolean)
                .map((publicId) => deleteFromCloudinary(publicId))
        );

        // Best-effort cleanup for any temp files that may still exist.
        await cleanupLocalFiles(files.map((file) => file?.path));

        throw new ApiError(500, 'Failed to upload all images. Please try again.');
    }

    return res
        .status(201)
        .json(new ApiResponse(201, successfulUploads, 'Images uploaded successfully'));
});

// POST /api/vendor/uploads/digital-file
export const uploadDigitalFile = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, 'File is required');
    }

    const folder = (req.body?.folder || 'vendors/products/digital').toString().trim();

    try {
        const uploaded = await uploadLocalFileToCloudinaryAndCleanup(req.file.path, folder, undefined, 'auto');
        return res
            .status(201)
            .json(new ApiResponse(201, uploaded, 'File uploaded successfully'));
    } catch (error) {
        await cleanupLocalFiles([req.file.path]);
        console.error("Digital file upload failed:", error);
        throw new ApiError(500, 'Digital file upload failed');
    }
});
