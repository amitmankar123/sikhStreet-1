import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import '../../src/models/index.js';

const seedArtTemplateSIUnit = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
    console.log("Connecting to database...");
    await mongoose.connect(dbUrl);

    const ProductTemplate = mongoose.model('ProductTemplate');
    const Category = mongoose.model('Category');

    const artTemplateData = {
      _id: "art-and-decors-template-uuid-0001",
      name: "Art & Decors Template",
      description: "Template for art prints with size, frame, material, and orientation variants — uses SI unit area pricing",
      supportedProductTypes: ["physical"],
      status: "published",
      workflowSteps: ["basic_info", "pricing", "inventory", "shipping", "seo", "preview", "publish"],
      steps: [
        {
          name: "Basic Information",
          sections: [
            {
              name: "General Details",
              fields: [
                { name: "name", label: "Product Name", type: "text", required: true },
                { name: "artistName", label: "Artist Name", type: "text", required: false },
                { name: "collectionName", label: "Collection Name", type: "text", required: false },
                { name: "description", label: "Description", type: "textarea", required: false }
              ]
            },
            {
              name: "Artwork Characteristics",
              fields: [
                {
                  name: "medium",
                  label: "Medium",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Oil", "Acrylic", "Watercolor", "Mixed Media", "Charcoal", "Ink", "Digital"]
                },
                {
                  name: "style",
                  label: "Style",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Abstract", "Modern", "Landscape", "Portrait", "Minimal", "Pop Art", "Contemporary"]
                },
                {
                  name: "orientation",
                  label: "Orientation",
                  type: "dropdown",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false,
                  options: ["Portrait", "Landscape", "Square"]
                },
                {
                  name: "yearCreated",
                  label: "Year Created",
                  type: "text",
                  attributeType: "specification",
                  isVariant: false,
                  affectsPrice: false,
                  required: false
                }
              ]
            }
          ]
        },
        {
          name: "Art Specifications",
          sections: [
            {
              name: "SI Unit & Size Config",
              fields: [
                {
                  name: "pricingUnit",
                  label: "Size Unit (SI Unit)",
                  type: "si_unit",
                  attributeType: "pricing",
                  isVariant: false,
                  affectsPrice: true,
                  required: true,
                  options: ["inches", "cm", "feet", "meter"],
                  defaultValue: "inches",
                  description: "Unit used to calculate price per area (Inches, Centimeters, Feet, Meters)"
                }
              ]
            },
            {
              name: "ATTRIBUTES",
              fields: [
                {
                  name: "size",
                  label: "Size",
                  type: "dimension",
                  attributeType: "variant",
                  isVariant: true,
                  affectsPrice: true,
                  required: true,
                  allowMultiple: true,
                  vendorCanAddOptions: true,
                  options: ["8x10", "12x16", "16x20", "20x30", "24x36", "30x40"],
                  placeholder: "Select size"
                },
                {
                  name: "frame_type",
                  label: "Frame Type",
                  type: "dropdown",
                  attributeType: "variant",
                  isVariant: true,
                  affectsPrice: true,
                  required: true,
                  allowMultiple: true,
                  vendorCanAddOptions: true,
                  options: ["Frameless", "Wooden Frame", "Black Frame", "White Frame", "Oak Frame", "Gold Metal Frame"],
                  placeholder: "Select frame type"
                },
                {
                  name: "material",
                  label: "Material",
                  type: "dropdown",
                  attributeType: "variant",
                  isVariant: true,
                  affectsPrice: true,
                  required: true,
                  allowMultiple: true,
                  vendorCanAddOptions: true,
                  options: ["Rolled Canvas", "Stretched Canvas", "Canvas Print", "Fine Art Paper"],
                  placeholder: "Select material"
                }
              ]
            }
          ]
        }
      ],
      matrixConfig: {
        enabled: true,
        allowedAttributes: ["size", "frame_type", "material"],
        affectsPrice: true,
        affectsSKU: true,
        affectsInventory: false,
        affectsShipping: false
      },
      pricingConfig: {
        supportsBasePrice: false,
        supportsVariantPrice: true,
        supportsAttributeAdjustments: true,
        supportsUnitAreaPricing: true,
        adjustments: []
      }
    };

    // Upsert template
    await ProductTemplate.findOneAndUpdate(
      { _id: artTemplateData._id },
      artTemplateData,
      { upsert: true, new: true }
    );
    console.log("✅ Updated Art & Decors Template in Database with SI Unit section!");

    // Also assign template to Category '6' (Artwork)
    const category = await Category.findById("6");
    if (category) {
      category.assignedTemplateId = artTemplateData._id;
      await category.save();
      console.log("✅ Assigned updated template to Artwork Category (ID: '6')");
    }

  } catch (err) {
    console.error("Error seeding template:", err);
  } finally {
    await mongoose.disconnect();
  }
};

seedArtTemplateSIUnit();
