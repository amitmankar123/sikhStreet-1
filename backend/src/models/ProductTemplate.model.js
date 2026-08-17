import mongoose from 'mongoose';
import crypto from 'crypto';
import { wrapModel } from '../utils/prismaMongooseWrapper.js';

/**
 * ProductTemplate Model
 *
 * Stores the full schema for a vendor listing wizard.
 * - steps[]          : Wizard steps with sections and fields (Mixed for flexibility)
 * - matrixConfig     : Which attributes participate in variant matrix + what it affects
 * - pricingConfig    : Pricing modes + attribute adjustment rules
 * - status           : 'draft' | 'published'
 * - version          : Integer version number (v1, v2...) for safe schema evolution
 *
 * ARCHITECTURE NOTE:
 * Steps are kept as Mixed type intentionally so that Art, Fashion, Kadda, Turban
 * templates can have completely different field shapes without DB migrations.
 * matrixConfig and pricingConfig are also Mixed for the same reason.
 *
 * HOW FIELDS INSIDE steps[] WORK:
 * Each field inside steps[].sections[].fields[] has:
 *   name            : unique key (e.g. "frame_type")
 *   label           : display label (e.g. "Frame Type")
 *   type            : text | textarea | number | dropdown | radio | multi_select | checkbox | dimension
 *   attributeType   : "descriptive" | "variant" | "price-affecting"
 *   isVariant       : bool — participates in variant matrix
 *   affectsPrice    : bool — price changes based on this field
 *   required        : bool — vendor must fill
 *   allowMultiple   : bool — vendor can select multiple values
 *   vendorCanAddOptions : bool — vendor adds their own values (e.g. custom dimensions)
 *   options         : string[] — predefined values (e.g. ["No Frame", "Wooden Frame"])
 *   placeholder     : string — UI hint for vendor
 *   helpText        : string — tooltip/hint below the field
 *   validation      : object — { min, max, pattern, message }
 *
 * HOW matrixConfig WORKS:
 *   enabled              : bool — turn matrix on/off for this template
 *   allowedAttributes    : string[] — field names that participate (e.g. ["size","frame_type"])
 *   pricePerCombination  : bool — each row gets its own price
 *   affectsPrice         : bool — matrix generates price cells
 *   affectsSKU           : bool — auto-generates SKU per combination
 *   affectsInventory     : bool — stock tracked per combination
 *   affectsShipping      : bool — shipping overrideable per combination
 *
 * HOW pricingConfig WORKS:
 *   supportsBasePrice           : bool — vendor sets one base price
 *   supportsVariantPrice        : bool — vendor sets price per combination row
 *   supportsAttributeAdjustments: bool — fixed/% adjustments per option value
 *   adjustments[]               : [{ attributeName, optionValue, adjustmentType, adjustmentValue }]
 */
const ProductTemplateSchema = new mongoose.Schema({
    _id: { type: String, default: () => crypto.randomUUID() },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    supportedProductTypes: { type: [String], default: ['physical'] },

    // Wizard steps — kept as Mixed for maximum flexibility across categories
    steps: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Standard workflow steps (non-configurable system steps)
    workflowSteps: {
        type: [String],
        default: ['basic_info', 'pricing', 'inventory', 'shipping', 'seo', 'preview', 'publish']
    },

    // Variant matrix configuration — which attributes generate the combination table
    matrixConfig: { type: mongoose.Schema.Types.Mixed, default: null },

    // Pricing feature flags and adjustment rules for this template
    pricingConfig: { type: mongoose.Schema.Types.Mixed, default: null },

    // Lifecycle state — draft templates are invisible to vendors
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },

    // Schema version — increment when making breaking changes so existing products still work
    version: { type: Number, default: 1 },

    // Soft delete flag
    isActive: { type: Boolean, default: true }

}, {
    timestamps: true,
    collection: 'ProductTemplate'
});

const MongooseProductTemplate = mongoose.models.ProductTemplate
    || mongoose.model('ProductTemplate', ProductTemplateSchema);

export const ProductTemplate = wrapModel(MongooseProductTemplate);
export default ProductTemplate;
