import { Router } from 'express';
import * as controller from '../controllers/marketplaceConfig.controller.js';
import { authenticate } from '../../../middlewares/authenticate.js';
import { authorize, enforceAccountStatus } from '../../../middlewares/authorize.js';

const router = Router();
const adminAuth = [authenticate, authorize('admin', 'superadmin'), enforceAccountStatus];

// Reusable Fields Library
router.get('/additional-fields', ...adminAuth, controller.getAdditionalFields);
router.post('/additional-fields', ...adminAuth, controller.createAdditionalField);
router.put('/additional-fields/:id', ...adminAuth, controller.updateAdditionalField);
router.delete('/additional-fields/:id', ...adminAuth, controller.deleteAdditionalField);

// Product Templates
router.get('/templates', ...adminAuth, controller.getProductTemplates);
router.post('/templates', ...adminAuth, controller.createProductTemplate);
router.put('/templates/:id', ...adminAuth, controller.updateProductTemplate);
router.delete('/templates/:id', ...adminAuth, controller.deleteProductTemplate);

// Product Types
router.get('/product-types', ...adminAuth, controller.getProductTypes);
router.post('/product-types', ...adminAuth, controller.createProductType);
router.put('/product-types/:id', ...adminAuth, controller.updateProductType);
router.delete('/product-types/:id', ...adminAuth, controller.deleteProductType);

// Schema Resolution (accessible by authenticated vendors/admins)
router.get('/resolve/:categoryId', authenticate, controller.resolveCategorySchema);

export default router;
