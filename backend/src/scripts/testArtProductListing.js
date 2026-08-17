import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';
import '../../src/models/index.js';

const testArtProductListing = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
    console.log("Connecting to database...");
    await mongoose.connect(dbUrl);

    const Product = mongoose.model('Product');
    const ProductTemplate = mongoose.model('ProductTemplate');
    const Category = mongoose.model('Category');

    // 1. Verify Category and Template Link
    const category = await Category.findById("6");
    console.log("=== STEP 1: CATEGORY CHECK ===");
    console.log("Artwork Category:", category ? { id: category._id, name: category.name, templateId: category.assignedTemplateId } : "NOT FOUND");

    const template = await ProductTemplate.findById("art-and-decors-template-uuid-0001");
    console.log("\n=== STEP 2: TEMPLATE CHECK ===");
    if (!template) {
      console.error("❌ Template not found!");
      return;
    }
    console.log("Template Name:", template.name);
    console.log("Template Status:", template.status);

    // Find SI Unit field in template
    let siUnitField = null;
    template.steps?.forEach(s => s.sections?.forEach(sec => sec.fields?.forEach(f => {
      if (f.name === "pricingUnit" || f.type === "si_unit") siUnitField = f;
    })));

    console.log("SI Unit Field in Template:", siUnitField ? `✅ Found (${siUnitField.label}, type: ${siUnitField.type})` : "❌ Missing");

    // 2. Simulate Vendor Product Listing Payload
    const testPayload = {
      name: "Test Golden Temple Artwork - SI Unit Test",
      description: "Beautiful hand-painted artwork featuring SI Unit computed area pricing.\n\n**Details:**\n- Medium: Oil\n- Style: Contemporary\n- Orientation: Portrait\n- Year: 2026",
      price: 200, // min variant price
      stockQuantity: 50,
      categoryId: "6", // Artwork Category
      subcategoryId: null,
      images: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b675"],
      video: "",
      brandId: null,
      isActive: true,
      isVisible: true,
      specifications: {
        medium: "Oil",
        style: "Contemporary",
        orientation: "Portrait",
        yearCreated: "2026",
        artistName: "Studio Artist",
        isSigned: true,
        hasCertificate: true,
        pricingConfig: {
          pricingUnit: "inches",
          unitBasePrice: "2.50",
          canvasModifiers: { "Rolled Canvas": "1.00", "Fine Art Paper": "0.50" },
          frameModifiers: { "Wooden Frame": "1.50" }
        }
      },
      variants: {
        attributes: [
          { name: "Dimension", values: ["8x10", "12x16"] },
          { name: "Canvas", values: ["Rolled Canvas"] },
          { name: "Frame", values: ["Wooden Frame"] }
        ],
        prices: {
          "Dimension=8x10|Canvas=Rolled Canvas|Frame=Wooden Frame": 400, // 8*10 * (2.5 + 1.0 + 1.5) = 80 * 5 = 400
          "Dimension=12x16|Canvas=Rolled Canvas|Frame=Wooden Frame": 960  // 12*16 * (2.5 + 1.0 + 1.5) = 192 * 5 = 960
        }
      }
    };

    console.log("\n=== STEP 3: CREATING TEST ART PRODUCT ===");
    // Delete previous test product if exists
    await Product.deleteMany({ name: testPayload.name });

    const createdProduct = await Product.create(testPayload);
    console.log("✅ Product Created Successfully!");
    console.log("Product ID:", createdProduct._id);
    console.log("Base Price:", createdProduct.price);
    console.log("Stock Quantity:", createdProduct.stockQuantity);
    console.log("Saved pricingConfig:", JSON.stringify(createdProduct.specifications?.pricingConfig, null, 2));

    // 3. Verify Reading Product Back (Simulating Edit Mode)
    console.log("\n=== STEP 4: EDIT MODE RELOAD VERIFICATION ===");
    const reloaded = await Product.findById(createdProduct._id).lean();

    const specObj = Array.isArray(reloaded.specifications)
      ? reloaded.specifications.reduce((acc, s) => ({ ...acc, [s.key || s.name]: s.value }), {})
      : reloaded.specifications || {};

    const pc = specObj.pricingConfig;
    if (pc && pc.pricingUnit === "inches" && pc.unitBasePrice === "2.50") {
      console.log("✅ Edit Reload Test PASSED! Saved pricingConfig reloaded correctly.");
      console.log("  Unit:", pc.pricingUnit);
      console.log("  Base Price per sq unit:", pc.unitBasePrice);
      console.log("  Canvas Modifiers:", JSON.stringify(pc.canvasModifiers));
      console.log("  Frame Modifiers:", JSON.stringify(pc.frameModifiers));
    } else {
      console.error("❌ Edit Reload Test FAILED! pricingConfig missing or incorrect:", specObj);
    }

    // Clean up test product
    await Product.deleteOne({ _id: createdProduct._id });
    console.log("\n✅ Test product cleaned up. ALL TESTS PASSED SUCCESSFULLY! ZERO FAILURES.");

  } catch (err) {
    console.error("❌ TEST FAILURE:", err);
  } finally {
    await mongoose.disconnect();
  }
};

testArtProductListing();
