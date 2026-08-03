import mongoose from 'mongoose';
import asyncHandler from '../../../utils/asyncHandler.js';
import ApiResponse from '../../../utils/ApiResponse.js';
import ApiError from '../../../utils/ApiError.js';

// ─── Reusable Fields Library ──────────────────────────────────────────
export const getAdditionalFields = asyncHandler(async (req, res) => {
    const AdditionalField = mongoose.model('AdditionalField');
    const fields = await AdditionalField.find({}).sort({ displayOrder: 1, name: 1 }).lean();
    const mapped = fields.map(f => ({ ...f, id: String(f._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Additional fields fetched.'));
});

export const createAdditionalField = asyncHandler(async (req, res) => {
    const AdditionalField = mongoose.model('AdditionalField');
    const payload = req.body;
    const existing = await AdditionalField.findOne({ name: payload.name }).lean();
    if (existing) {
        throw new ApiError(409, 'Field with this name already exists.');
    }
    const field = await AdditionalField.create(payload);
    res.status(201).json(new ApiResponse(201, { ...field.toObject(), id: String(field._id) }, 'Additional field created.'));
});

export const updateAdditionalField = asyncHandler(async (req, res) => {
    const AdditionalField = mongoose.model('AdditionalField');
    const field = await AdditionalField.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { new: true }
    ).lean();
    if (!field) {
        throw new ApiError(404, 'Additional field not found.');
    }
    res.status(200).json(new ApiResponse(200, { ...field, id: String(field._id) }, 'Additional field updated.'));
});

export const deleteAdditionalField = asyncHandler(async (req, res) => {
    const AdditionalField = mongoose.model('AdditionalField');
    const field = await AdditionalField.findOne({ _id: req.params.id }).lean();
    if (!field) {
        throw new ApiError(404, 'Additional field not found.');
    }
    await AdditionalField.deleteOne({ _id: req.params.id });
    res.status(200).json(new ApiResponse(200, null, 'Additional field deleted.'));
});

// ─── Product Templates ──────────────────────────────────────────────────
export const getProductTemplates = asyncHandler(async (req, res) => {
    const ProductTemplate = mongoose.model('ProductTemplate');
    const templates = await ProductTemplate.find({}).sort({ name: 1 }).lean();
    const mapped = templates.map(t => ({ ...t, id: String(t._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Templates fetched.'));
});

export const createProductTemplate = asyncHandler(async (req, res) => {
    const ProductTemplate = mongoose.model('ProductTemplate');
    const template = await ProductTemplate.create(req.body);
    res.status(201).json(new ApiResponse(201, { ...template.toObject(), id: String(template._id) }, 'Template created.'));
});

export const updateProductTemplate = asyncHandler(async (req, res) => {
    const ProductTemplate = mongoose.model('ProductTemplate');
    const template = await ProductTemplate.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { new: true }
    ).lean();
    if (!template) {
        throw new ApiError(404, 'Template not found.');
    }
    res.status(200).json(new ApiResponse(200, { ...template, id: String(template._id) }, 'Template updated.'));
});

export const deleteProductTemplate = asyncHandler(async (req, res) => {
    const ProductTemplate = mongoose.model('ProductTemplate');
    const template = await ProductTemplate.findOne({ _id: req.params.id }).lean();
    if (!template) {
        throw new ApiError(404, 'Template not found.');
    }
    await ProductTemplate.deleteOne({ _id: req.params.id });
    res.status(200).json(new ApiResponse(200, null, 'Template deleted.'));
});

// ─── Product Types ──────────────────────────────────────────────────────
export const getProductTypes = asyncHandler(async (req, res) => {
    const ProductType = mongoose.model('ProductType');
    const types = await ProductType.find({}).sort({ name: 1 }).lean();
    const mapped = types.map(t => ({ ...t, id: String(t._id) }));
    res.status(200).json(new ApiResponse(200, mapped, 'Product types fetched.'));
});

export const createProductType = asyncHandler(async (req, res) => {
    const ProductType = mongoose.model('ProductType');
    const payload = req.body;
    const existing = await ProductType.findOne({ name: payload.name }).lean();
    if (existing) {
        throw new ApiError(409, 'Product type already exists.');
    }
    const type = await ProductType.create(payload);
    res.status(201).json(new ApiResponse(201, { ...type.toObject(), id: String(type._id) }, 'Product type created.'));
});

export const updateProductType = asyncHandler(async (req, res) => {
    const ProductType = mongoose.model('ProductType');
    const type = await ProductType.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { new: true }
    ).lean();
    if (!type) {
        throw new ApiError(404, 'Product type not found.');
    }
    res.status(200).json(new ApiResponse(200, { ...type, id: String(type._id) }, 'Product type updated.'));
});

export const deleteProductType = asyncHandler(async (req, res) => {
    const ProductType = mongoose.model('ProductType');
    const type = await ProductType.findOne({ _id: req.params.id }).lean();
    if (!type) {
        throw new ApiError(404, 'Product type not found.');
    }
    await ProductType.deleteOne({ _id: req.params.id });
    res.status(200).json(new ApiResponse(200, null, 'Product type deleted.'));
});

// ─── Schema Resolution ────────────────────────────────────────────────
export const resolveCategorySchema = asyncHandler(async (req, res) => {
    const Category = mongoose.model('Category');
    const ProductTemplate = mongoose.model('ProductTemplate');

    let currentCategoryId = req.params.categoryId;
    let template = null;
    const additionalFields = [];
    const visited = new Set();

    while (currentCategoryId && !visited.has(currentCategoryId)) {
        visited.add(currentCategoryId);
        const cat = await Category.findById(currentCategoryId).lean();
        if (!cat) break;

        // Gather additional fields (attached directly to this category level)
        if (Array.isArray(cat.additionalFields) && cat.additionalFields.length > 0) {
            // Prepend so that ancestor's fields come first
            additionalFields.unshift(...cat.additionalFields);
        }

        // Check if there is a template assigned at this level
        if (cat.assignedTemplateId && !template) {
            template = await ProductTemplate.findById(cat.assignedTemplateId).lean();
        }

        currentCategoryId = cat.parentId;
    }

    if (!template) {
        // Return a default mock-style simple template if none found in ancestry
        return res.status(200).json(new ApiResponse(200, {
            name: "Default Template",
            supportedProductTypes: ["physical", "digital"],
            steps: [
                {
                    name: "Basic Information",
                    sections: [
                        {
                            name: "General",
                            fields: [
                                { name: "name", label: "Product Name", type: "text", required: true },
                                { name: "description", label: "Description", type: "textarea", required: false }
                            ]
                        }
                    ]
                },
                {
                    name: "Pricing & Inventory",
                    sections: [
                        {
                            name: "Pricing",
                            fields: [
                                { name: "price", label: "Price", type: "number", required: true },
                                { name: "originalPrice", label: "Original Price", type: "number", required: false }
                            ]
                        }
                    ]
                }
            ]
        }, 'Resolved default template.'));
    }

    // Deep copy steps
    const resolvedSteps = JSON.parse(JSON.stringify(template.steps || []));

    // Merge additional fields if they exist
    if (additionalFields.length > 0) {
        // Filter out duplicate fields from the template sections
        const additionalFieldNames = additionalFields.map(f => String(f.name).toLowerCase());
        const additionalFieldSimplifiedNames = additionalFields.map(f => 
            String(f.name).replace(/^book_/, '').toLowerCase()
        );
        const additionalFieldLabels = additionalFields.map(f => String(f.label).toLowerCase());

        resolvedSteps.forEach(step => {
            if (step.sections) {
                step.sections.forEach(sec => {
                    if (sec.fields) {
                        sec.fields = sec.fields.filter(field => {
                            const fieldNameLower = String(field.name).toLowerCase();
                            const fieldLabelLower = String(field.label).toLowerCase();
                            
                            // Check if this template field is overridden by an additional field
                            const isDuplicate = 
                                additionalFieldNames.includes(fieldNameLower) ||
                                additionalFieldSimplifiedNames.includes(fieldNameLower) ||
                                additionalFieldNames.includes(`book_${fieldNameLower}`) ||
                                additionalFieldLabels.includes(fieldLabelLower);
                            
                            return !isDuplicate;
                        });
                    }
                });
            }
        });

        // Find if there is a step named "Category Specific Details" or "Book Details" or similar
        let detailsStep = resolvedSteps.find(step => 
            String(step.name).toLowerCase().includes("detail") || 
            String(step.name).toLowerCase().includes("category")
        );

        if (!detailsStep) {
            // Create "Category Specific Details" step and insert it after basic info / category selection
            detailsStep = {
                name: "Category Specific Details",
                sections: []
            };
            // Insert at index 2 or end
            if (resolvedSteps.length > 1) {
                resolvedSteps.splice(2, 0, detailsStep);
            } else {
                resolvedSteps.push(detailsStep);
            }
        }

        // Find or create "Additional Details" section
        let additionalSection = detailsStep.sections.find(sec => 
            String(sec.name).toLowerCase().includes("additional") ||
            String(sec.name).toLowerCase().includes("spec")
        );

        if (!additionalSection) {
            additionalSection = {
                name: "Additional Specifications",
                fields: []
            };
            detailsStep.sections.push(additionalSection);
        }

        // Append the merged additional fields
        additionalSection.fields.push(...additionalFields);

        // Enforce ordering and mandatory (required) status for ISBN, Author, and Publisher
        if (detailsStep && detailsStep.sections) {
            const specSection = detailsStep.sections.find(sec => 
                String(sec.name).toLowerCase().includes("spec") ||
                String(sec.name).toLowerCase().includes("additional")
            );

            if (specSection && specSection.fields) {
                const isbnField = specSection.fields.find(f => String(f.name).toLowerCase() === 'isbn');
                const authorField = specSection.fields.find(f => String(f.name).toLowerCase() === 'book_author' || String(f.name).toLowerCase() === 'author');
                const publisherField = specSection.fields.find(f => String(f.name).toLowerCase() === 'book_publisher' || String(f.name).toLowerCase() === 'publisher');

                if (isbnField) isbnField.required = true;
                if (authorField) authorField.required = true;
                if (publisherField) publisherField.required = true;

                const orderedFields = [];
                if (isbnField) orderedFields.push(isbnField);
                if (authorField) orderedFields.push(authorField);
                if (publisherField) orderedFields.push(publisherField);

                specSection.fields.forEach(f => {
                    const fname = String(f.name).toLowerCase();
                    if (fname !== 'isbn' && fname !== 'author' && fname !== 'book_author' && fname !== 'publisher' && fname !== 'book_publisher') {
                        orderedFields.push(f);
                    }
                });

                specSection.fields = orderedFields;
            }
        }
    }

    res.status(200).json(new ApiResponse(200, {
        ...template,
        steps: resolvedSteps
    }, 'Resolved merged category template successfully.'));
});
