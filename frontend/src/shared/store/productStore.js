import { create } from 'zustand';
import * as adminService from '../../modules/Admin/services/adminService';
import { products as mockProducts } from '../../data/products';
import toast from 'react-hot-toast';

export const useProductStore = create((set, get) => ({
    products: [],
    isLoading: false,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
    },

    fetchProducts: async (params = {}) => {
        set({ isLoading: true });
        try {
            const response = await adminService.getAllProducts(params);
            // Check if response.data is an array or object with products
            const productsData = Array.isArray(response.data) ? response.data : (response.data.products || []);
            const normalizedProducts = productsData.map(p => ({
                ...p,
                id: p._id || p.id,
                stockQuantity: p.stockQuantity || 0,
                price: p.price || 0,
                image: p.images?.[0] || p.image || 'https://placehold.co/50x50?text=Product'
            }));

            set({
                products: normalizedProducts,
                pagination: response.data.pagination || get().pagination,
                isLoading: false
            });
        } catch (error) {
            console.warn("Backend products failed, using fallback:", error);
            const fallback = mockProducts.map(p => ({
                ...p,
                id: p.id || p._id,
                stockQuantity: p.stockQuantity || 0,
                price: p.price || 0,
                image: p.image || 'https://placehold.co/50x50?text=Product'
            }));
            set({
                products: fallback,
                pagination: { total: fallback.length, page: 1, limit: 100, pages: 1 },
                isLoading: false
            });
        }
    }
}));
