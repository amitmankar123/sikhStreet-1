import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../utils/api';

const isMongoObjectId = (value) => {
  const str = String(value || '').trim();
  return /^[a-fA-F0-9]{24}$/.test(str) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str);
};

const normalizeReview = (review) => ({
  ...review,
  id: review?.id || review?._id || Date.now().toString(),
  user: review?.user || review?.userId?.name || 'User',
  date: review?.date || review?.createdAt || new Date().toISOString(),
  helpfulCount: review?.helpfulCount || 0,
  notHelpfulCount: review?.notHelpfulCount || 0,
});


const DEFAULT_MOCK_REVIEWS = [
  { id: 'mock-1', user: 'Zolton', rating: 5, comment: 'Great Gift - Good Material - Good Quality!', date: '2026-07-08T00:00:00.000Z', helpfulCount: 3 },
  { id: 'mock-2', user: 'jessica', rating: 5, comment: 'Exactly what I ordered. Thank you', date: '2026-03-07T00:00:00.000Z', helpfulCount: 1 },
  { id: 'mock-3', user: 'Shelby', rating: 5, comment: 'The feel of this fabric is wonderful, and it is still very sturdy. Great price and swift delivery, as well. Customer service has been exceptional and wonderfully kind. Cannot praise them enough!', date: '2025-07-31T00:00:00.000Z', helpfulCount: 2 },
  { id: 'mock-4', user: 'Drew', rating: 5, comment: 'This was EXACTLY what I was looking for! The seller was super helpful and friendly and answered all of my questions. It came super fast and the quality is top notch! I would 100% recommend anyone looking for turbans to buy from this seller! I will be back for sure - can\'t wait to try the other colors and patterns! Thanks again!!', date: '2025-07-25T00:00:00.000Z', helpfulCount: 4 }
];

export const useReviewsStore = create(
  persist(
    (set, get) => ({
      reviews: {},
      votes: {},
      isLoading: false,
      error: null,

      fetchReviews: async (productId, options = {}) => {
        if (!productId || !isMongoObjectId(String(productId))) {
          return get().sortReviews(productId, options?.sort || 'newest');
        }

        set({ isLoading: true, error: null });
        try {
          const { sort = 'newest', page = 1, limit = 20 } = options;
          const response = await api.get(
            `/user/reviews/product/${productId}?sort=${encodeURIComponent(sort)}&page=${page}&limit=${limit}`
          );
          const payload = response?.data || {};
          const fetched = Array.isArray(payload?.reviews)
            ? payload.reviews.map(normalizeReview)
            : [];

          set((state) => ({
            reviews: {
              ...state.reviews,
              [productId]: fetched,
            },
            isLoading: false,
          }));

          return fetched;
        } catch (error) {
          set({ isLoading: false, error: error?.message || 'Failed to fetch reviews' });
          return get().sortReviews(productId, options?.sort || 'newest');
        }
      },

      // Add review for a product
      addReview: async (productId, review) => {
        const normalizedProductId = String(productId);

        if (!isMongoObjectId(normalizedProductId)) {
          set((state) => {
            let productReviews = state.reviews[normalizedProductId] || [];
          if (productReviews.length === 0 && (!normalizedProductId || !isMongoObjectId(String(normalizedProductId)))) {
            productReviews = DEFAULT_MOCK_REVIEWS.map(r => normalizeReview(r));
          }
            const newReview = normalizeReview({
              ...review,
              id: Date.now().toString(),
            });
            return {
              reviews: {
                ...state.reviews,
                [normalizedProductId]: [...productReviews, newReview],
              },
            };
          });
          return true;
        }

        try {
          const response = await api.post('/user/reviews', {
            productId: normalizedProductId,
            orderId: review?.orderId,
            rating: review?.rating,
            comment: review?.comment,
            images: review?.images || [],
          });
          const payload = response?.data;
          if (payload) {
            const added = normalizeReview(payload);
            set((state) => ({
              reviews: {
                ...state.reviews,
                [normalizedProductId]: [...(state.reviews[normalizedProductId] || []), added],
              },
            }));
          }
          return true;
        } catch {
          return false;
        }
      },

      // Get reviews for a product
      getReviews: (productId) => {
        const state = get();
        return state.reviews[productId] || [];
      },

      // Vote on review helpfulness
      voteHelpful: async (productId, reviewId) => {
        const normalizedProductId = String(productId);
        const voteKey = `${normalizedProductId}_${reviewId}`;
        if (get().votes[voteKey]) {
          return false;
        }

        if (isMongoObjectId(normalizedProductId) && isMongoObjectId(String(reviewId))) {
          try {
            const response = await api.post(`/user/reviews/${reviewId}/helpful`);
            const payload = response?.data;
            const helpfulCount = payload?.helpfulCount;
            set((state) => ({
              reviews: {
                ...state.reviews,
                [normalizedProductId]: (state.reviews[normalizedProductId] || []).map((review) =>
                  review.id === reviewId || review._id === reviewId
                    ? {
                      ...review,
                      helpfulCount: typeof helpfulCount === 'number'
                        ? helpfulCount
                        : (review.helpfulCount || 0) + 1,
                    }
                    : review
                ),
              },
              votes: {
                ...state.votes,
                [voteKey]: 'helpful',
              },
            }));
            return true;
          } catch {
            return false;
          }
        }

        set((state) => {
          if (state.votes[voteKey]) {
            return state; // Already voted
          }

          const productReviews = state.reviews[normalizedProductId] || [];
          const updatedReviews = productReviews.map((review) =>
            review.id === reviewId
              ? { ...review, helpfulCount: (review.helpfulCount || 0) + 1 }
              : review
          );

          return {
            reviews: {
              ...state.reviews,
              [normalizedProductId]: updatedReviews,
            },
            votes: {
              ...state.votes,
              [voteKey]: 'helpful',
            },
          };
        });
        return true;
      },

      // Vote on review not helpful
      voteNotHelpful: (productId, reviewId) => {
        set((state) => {
          const voteKey = `${productId}_${reviewId}`;
          if (state.votes[voteKey]) {
            return state; // Already voted
          }

          let productReviews = state.reviews[productId] || [];
          if (productReviews.length === 0 && (!productId || !isMongoObjectId(String(productId)))) {
            productReviews = DEFAULT_MOCK_REVIEWS.map(r => normalizeReview(r));
          }
          const updatedReviews = productReviews.map((review) =>
            review.id === reviewId
              ? { ...review, notHelpfulCount: (review.notHelpfulCount || 0) + 1 }
              : review
          );

          return {
            reviews: {
              ...state.reviews,
              [productId]: updatedReviews,
            },
            votes: {
              ...state.votes,
              [voteKey]: 'not-helpful',
            },
          };
        });
      },

      // Check if user has voted on a review
      hasVoted: (productId, reviewId) => {
        const state = get();
        const voteKey = `${productId}_${reviewId}`;
        return !!state.votes[voteKey];
      },

      // Sort reviews
      sortReviews: (productId, sortBy) => {
        const state = get();
        let reviews = state.reviews[productId] || [];
        if (reviews.length === 0 && (!productId || !isMongoObjectId(String(productId)))) {
          reviews = DEFAULT_MOCK_REVIEWS.map(r => normalizeReview(r));
        }
        let sorted = [...reviews];

        switch (sortBy) {
          case 'newest':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
          case 'oldest':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
          case 'most-helpful':
            sorted.sort(
              (a, b) =>
                (b.helpfulCount || 0) - (a.helpfulCount || 0) ||
                (a.notHelpfulCount || 0) - (b.notHelpfulCount || 0)
            );
            break;
          case 'highest-rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
          case 'lowest-rating':
            sorted.sort((a, b) => a.rating - b.rating);
            break;
          default:
            break;
        }

        return sorted;
      },
    }),
    {
      name: 'reviews-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

