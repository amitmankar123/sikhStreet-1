import 'dotenv/config';
import mongoose from 'mongoose';
import '../../src/models/index.js';
import { resolveCategorySchema } from '../modules/admin/controllers/marketplaceConfig.controller.js';

const testResolve = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI;
        await mongoose.connect(dbUrl);
        
        // Mock req and res objects
        const req = {
            params: {
                categoryId: "6"
            }
        };
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };

        // Call the controller method
        await resolveCategorySchema(req, res, (err) => {
            if (err) console.error("Error passed to next():", err);
        });

        console.log("=== API Response Status ===");
        console.log(res.statusCode);
        console.log("=== API Response Data ===");
        console.log(JSON.stringify(res.data, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

testResolve();
