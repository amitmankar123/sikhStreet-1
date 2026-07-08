import whiteTShirtImg from "../../data/products/white t shirt.png";
import blueJeansImg from "../../data/products/blue jeans.png";
import summerDressImg from "../../data/products/summer dress.png";
import leatherBagImg from "../../data/products/leather bag.png";
import sneakersImg from "../../data/products/sneakers.png";
import sunglassImg from "../../data/products/sunglass.png";
import winterScarfImg from "../../data/products/winter scarf.png";
import blazerImg from "../../data/products/blazer.png";
import denimJacketImg from "../../data/products/denim jacket.png";
import healsImg from "../../data/products/heals.png";
import trackPantsImg from "../../data/products/track pants.png";
import sweaterImg from "../../data/products/sweater.png";
import leatherBootsImg from "../../data/products/leather boots.png";
import stylishWatchImg from "../../data/products/stylish kara.png";
import gownImg from "../../data/products/gown.png";
import shirtImg from "../../data/products/shirt.png";
import maxiImg from "../../data/products/maxi.png";
import necklessImg from "../../data/products/neckless.png";
import athlaticShoesImg from "../../data/products/athlatic shoes.png";
import beltImg from "../../data/products/belt.png";
import menScarfImg from "../../data/products/Men_scarf.png";
import blackTurbanImg from "../../data/products/black-turban.avif";
import gamingHeadsetImg from "../../data/products/gaming_headset.png";
import mechanicalKeyboardImg from "../../data/products/mechanical_keyboard.png";
import menBlackKurtaImg from "../../data/products/men_blackKurta-removebg-preview.png";
import redTurbanImg from "../../data/products/red_turban-removebg-preview.png";

export const products = [
  {
    id: 1,
    name: "Classic White T-Shirt",
    unit: "Piece",
    price: 24.99,
    originalPrice: 29.99,
    image: whiteTShirtImg,
    images: [whiteTShirtImg, whiteTShirtImg, whiteTShirtImg],
    variants: {
      sizes: ["S", "M", "L", "XL"],
      prices: {
        S: 24.99,
        M: 24.99,
        L: 26.99,
        XL: 26.99,
      },
      defaultVariant: { size: "M" },
    },
    categoryId: "t-shirts",
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 45,
    rating: 4.9,
    reviewCount: 290,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 1,
  },
  {
    id: 2,
    name: "Slim Fit Blue Jeans",
    unit: "Piece",
    price: 79.99,
    originalPrice: 89.99,
    image: blueJeansImg,
    categoryId: "fashion",
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 120,
    rating: 4.2,
    reviewCount: 89,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 4,
  },

  {
    id: 4,
    name: "Leather Crossbody Bag",
    unit: "Piece",
    price: 89.99,
    originalPrice: 119.99,
    image: leatherBagImg,
    categoryId: "fashion",
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 65,
    rating: 4.9,
    reviewCount: 270,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 6,
  },
  {
    id: 5,
    name: "Casual Canvas Sneakers",
    unit: "Pair",
    price: 49.99,
    originalPrice: 69.99,
    image: sneakersImg,
    categoryId: "fashion",
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 30,
    rating: 4.3,
    reviewCount: 72,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
    brandId: 3,
  },
  {
    id: 6,
    name: "Designer Sunglasses",
    unit: "Piece",
    price: 125.99,
    originalPrice: 179.99,
    image: sunglassImg,
    categoryId: "fashion",
    images: [sunglassImg, sunglassImg, sunglassImg],
    variants: {
      colors: ["Black", "Brown", "Tortoise", "Silver"],
      prices: {
        Black: 125.99,
        Brown: 129.99,
        Tortoise: 135.99,
        Silver: 139.99,
      },
      defaultVariant: { color: "Black" },
    },
    flashSale: true,
    stock: "in_stock",
    stockQuantity: 15,
    rating: 4.8,
    reviewCount: 305,
    vendorId: 1,
    vendorName: "Fashion Hub",
    brandId: 5,
  },
  {
    id: 7,
    name: "Wool Winter Scarf",
    unit: "Piece",
    price: 34.99,
    image: winterScarfImg,
    categoryId: "scarves",
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 200,
    rating: 4.1,
    reviewCount: 112,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 8,
    name: "Formal Blazer Jacket",
    unit: "Piece",
    price: 149.99,
    originalPrice: 199.99,
    image: blazerImg,
    categoryId: "jackets",
    flashSale: true,
    stock: "low_stock",
    stockQuantity: 5,
    rating: 4.6,
    reviewCount: 98,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 9,
    name: "Denim Jacket",
    unit: "Piece",
    price: 69.99,
    image: denimJacketImg,
    categoryId: "jackets",
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 85,
    rating: 4.4,
    reviewCount: 67,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },

  {
    id: 11,
    name: "Sporty Track Pants",
    unit: "Piece",
    price: 54.99,
    originalPrice: 69.99,
    image: trackPantsImg,
    categoryId: "fashion",
    images: [trackPantsImg, trackPantsImg],
    variants: {
      sizes: ["S", "M", "L", "XL", "XXL"],
      prices: {
        S: 54.99,
        M: 54.99,
        L: 56.99,
        XL: 56.99,
        XXL: 59.99,
      },
      defaultVariant: { size: "M" },
    },
    flashSale: false,
    stock: "in_stock",
    stockQuantity: 42,
    rating: 4.3,
    reviewCount: 189,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 12,
    name: "Knit Cardigan Sweater",
    unit: "Piece",
    price: 74.99,
    originalPrice: 99.99,
    image: sweaterImg,
    categoryId: "hoodies",
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 78,
    rating: 4.6,
    reviewCount: 201,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 13,
    name: "Leather Ankle Boots",
    unit: "Pair",
    price: 119.99,
    image: leatherBootsImg,
    categoryId: "fashion",
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 95,
    rating: 4.4,
    reviewCount: 167,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 14,
    name: "Kara",
    unit: "Piece",
    price: 249.99,
    originalPrice: 349.99,
    image: stylishWatchImg,
    categoryId: "fashion",
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 150,
    rating: 4.7,
    reviewCount: 320,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },

  {
    id: 16,
    name: "Casual Flannel Shirt",
    unit: "Piece",
    price: 44.99,
    originalPrice: 59.99,
    image: shirtImg,
    categoryId: "fashion",
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 60,
    rating: 4.5,
    reviewCount: 145,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },

  {
    id: 18,
    name: "Statement Necklace",
    unit: "Piece",
    price: 39.99,
    originalPrice: 49.99,
    image: necklessImg,
    categoryId: "fashion",
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 35,
    rating: 4.8,
    reviewCount: 256,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 19,
    name: "Athletic Running Shoes",
    unit: "Pair",
    price: 94.99,
    originalPrice: 129.99,
    image: athlaticShoesImg,
    categoryId: "fashion",
    flashSale: true,
    isNewArrival: true,
    stock: "low_stock",
    stockQuantity: 12,
    rating: 4.4,
    reviewCount: 178,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 20,
    name: "Classic Leather Belt",
    unit: "Piece",
    price: 34.99,
    originalPrice: 49.99,
    image: beltImg,
    categoryId: "fashion",
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 52,
    rating: 4.5,
    reviewCount: 134,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },

  {
    id: 107,
    name: "Men's Classic Scarf",
    categoryId: "scarves",
    unit: "Piece",
    price: 15.99,
    originalPrice: 20.00,
    image: menScarfImg,
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 40,
    rating: 4.9,
    reviewCount: 340,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 108,
    name: "Black Turban",
    categoryId: "stitched",
    unit: "Piece",
    price: 18.99,
    image: blackTurbanImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 65,
    rating: 4.9,
    reviewCount: 295,
    vendorId: 1,
    vendorName: "Khalsa Store",
  },
  {
    id: 109,
    name: "Pro Gaming Headset",
    categoryId: "electronics",
    unit: "Piece",
    price: 89.99,
    originalPrice: 120.00,
    image: gamingHeadsetImg,
    flashSale: true,
    isNewArrival: true,
    stock: "low_stock",
    stockQuantity: 10,
    rating: 4.7,
    reviewCount: 280,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 110,
    name: "Mechanical RGB Keyboard",
    categoryId: "electronics",
    unit: "Piece",
    price: 130.00,
    originalPrice: 150.00,
    image: mechanicalKeyboardImg,
    flashSale: false,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 25,
    rating: 4.9,
    reviewCount: 245,
    vendorId: 2,
    vendorName: "Tech Gear Pro",
  },
  {
    id: 111,
    name: "Men's Black Kurta",
    categoryId: "fashion",
    unit: "Piece",
    price: 45.00,
    originalPrice: 60.00,
    image: menBlackKurtaImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 80,
    rating: 4.9,
    reviewCount: 350,
    vendorId: 1,
    vendorName: "Fashion Hub",
  },
  {
    id: 112,
    name: "Royal Red Turban",
    categoryId: "stitched",
    unit: "Piece",
    price: 20.00,
    originalPrice: 25.00,
    image: redTurbanImg,
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 45,
    rating: 4.8,
    reviewCount: 265,
    vendorId: 1,
    vendorName: "Khalsa Store",
  },
  {
    id: 201,
    name: "The Heritage Kirpan",
    categoryId: 6,
    unit: "Piece",
    price: 450.00,
    originalPrice: 499.00,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAB_FlddTVwub3YHuAccIzP3T_3YVM3MTr3fwwTBs7Bm2Tp59wCogEV3NVez76qM9wCrhKwR084udP97LDz4LE2xwk7uvC9r6e-gAN2KTnPw8Oa-XnzuOPuZg84Z-X-_ennmwj5YaPiWa6Gn5r5PA_17Snr2nYvq-4yx6OiYgym6o7EO_uYCQ_P8cyj8qQABYDRFb5JKkonC_p_wJt-q5BS8tqVuXwna-iIlEZtLRKftihRUM2gVjWPyNmX570OcfZq3VxSLFbj8eCK",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuAB_FlddTVwub3YHuAccIzP3T_3YVM3MTr3fwwTBs7Bm2Tp59wCogEV3NVez76qM9wCrhKwR084udP97LDz4LE2xwk7uvC9r6e-gAN2KTnPw8Oa-XnzuOPuZg84Z-X-_ennmwj5YaPiWa6Gn5r5PA_17Snr2nYvq-4yx6OiYgym6o7EO_uYCQ_P8cyj8qQABYDRFb5JKkonC_p_wJt-q5BS8tqVuXwna-iIlEZtLRKftihRUM2gVjWPyNmX570OcfZq3VxSLFbj8eCK"],
    description: "Hand-forged steel with silver damascene hilt, a symbol of honor and history.",
    flashSale: true,
    isNewArrival: true,
    stock: "in_stock",
    stockQuantity: 10,
    rating: 5.0,
    reviewCount: 48,
    vendorId: 1,
    vendorName: "Heritage Forge",
  },
  {
    id: 202,
    name: "Amrit Leather Journal",
    categoryId: "books",
    unit: "Piece",
    price: 65.00,
    originalPrice: 75.00,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlmuNp9PDjf_1CUvfQBz5315dzAPAUAqw0rzwvYww8TcNkDQ8sEyaASj2NSDfv1bNlBTLKTvojupmVbJlyWLUVMx-yuWz2Z2jfYky_jyRCm3sm7pIrWd1EX7OUKVJWykgieEVXrmm8nfS7W5y0VfB11NUdlzZwR-CRmavluHxx0jhn5QtNAtFmFzXVRunYYKb2ppM7fYc-pVMdQof5XYo99_jjViHf-5T9G2eeELgbXjq-26XtHT49SeTkogXq5z225FAIKirFnuhp",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuAlmuNp9PDjf_1CUvfQBz5315dzAPAUAqw0rzwvYww8TcNkDQ8sEyaASj2NSDfv1bNlBTLKTvojupmVbJlyWLUVMx-yuWz2Z2jfYky_jyRCm3sm7pIrWd1EX7OUKVJWykgieEVXrmm8nfS7W5y0VfB11NUdlzZwR-CRmavluHxx0jhn5QtNAtFmFzXVRunYYKb2ppM7fYc-pVMdQof5XYo99_jjViHf-5T9G2eeELgbXjq-26XtHT49SeTkogXq5z225FAIKirFnuhp"],
    description: "Fine handcrafted leather journal with embossed Sikh motifs.",
    flashSale: false,
    isNewArrival: false,
    stock: "in_stock",
    stockQuantity: 25,
    rating: 4.8,
    reviewCount: 34,
    vendorId: 2,
    vendorName: "Sikh Scribes",
  },
  {
    id: 203,
    name: "Gold Zari Juttis",
    categoryId: "fashion",
    unit: "Pair",
    price: 120.00,
    originalPrice: 150.00,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzqot-ogiJELUahh_Lu2_kO-ivxnd4WgC2ZpX80rJN4KVFNg8se0Wltumxz73QBDA8cCiO4Sf4bCjRBi66aNenQBX5B0m-wR21jJF45mA7mJCac0IrBaAG9vbbc-NfNian9OwnO9-Zue-N_qyYAvTQMPugc5pwupscE4YhM2lDxNQ_goMaPc4AYaPR9bFUBM00yEZ1G4n4rh-oBZnKsfNwRwghAXwSpTgoArv-EmL5CeggOdFbTbAcZVh_SCaI50rk6-MMoIjJx9_F",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCzqot-ogiJELUahh_Lu2_kO-ivxnd4WgC2ZpX80rJN4KVFNg8se0Wltumxz73QBDA8cCiO4Sf4bCjRBi66aNenQBX5B0m-wR21jJF45mA7mJCac0IrBaAG9vbbc-NfNian9OwnO9-Zue-N_qyYAvTQMPugc5pwupscE4YhM2lDxNQ_goMaPc4AYaPR9bFUBM00yEZ1G4n4rh-oBZnKsfNwRwghAXwSpTgoArv-EmL5CeggOdFbTbAcZVh_SCaI50rk6-MMoIjJx9_F"],
    description: "Traditional Punjabi juttis featuring shimmering gold zari thread embroidery.",
    flashSale: false,
    isNewArrival: false,
    stock: "in_stock",
    stockQuantity: 15,
    rating: 4.9,
    reviewCount: 19,
    vendorId: 1,
    vendorName: "Royal Steps",
  },
  {
    id: 204,
    name: "The Autumn Full-Voile",
    categoryId: "turbans",
    unit: "Piece",
    price: 35.00,
    originalPrice: 40.00,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYmBbQgT4GjHnm4gBbe5c_oh1BrLfAaKPoascNksV4jqWmfcDk0WyEQD-LG0T9YRjZ2Gq1leY6dHjXRsTcPXwC_p8TFFJzdZOWrpXhCqnIZMy0oCyTn6VWgCrurZcpTEk70J52HbTCKEr1yDMHM1zfqWyd-KKh_wEE-Z5mEj0XAzoaQMWd4TtkxvBaBdf9Rrl2h_-ELFdOmYzZNeHlNSj0XNwjR-Vwb0r--Ii_QAwUhDFkXYtJe2eNOB5p7oerqRo-KDNJINfzILWI",
    images: ["https://lh3.googleusercontent.com/aida-public/AB6AXuAYmBbQgT4GjHnm4gBbe5c_oh1BrLfAaKPoascNksV4jqWmfcDk0WyEQD-LG0T9YRjZ2Gq1leY6dHjXRsTcPXwC_p8TFFJzdZOWrpXhCqnIZMy0oCyTn6VWgCrurZcpTEk70J52HbTCKEr1yDMHM1zfqWyd-KKh_wEE-Z5mEj0XAzoaQMWd4TtkxvBaBdf9Rrl2h_-ELFdOmYzZNeHlNSj0XNwjR-Vwb0r--Ii_QAwUhDFkXYtJe2eNOB5p7oerqRo-KDNJINfzILWI"],
    description: "Our signature breathable cotton in seasonal shades of the harvest.",
    flashSale: false,
    isNewArrival: false,
    stock: "in_stock",
    stockQuantity: 30,
    rating: 4.7,
    reviewCount: 22,
    vendorId: 3,
    vendorName: "Heritage Weaves",
  },
];

export const getMostPopular = () => products.slice(0, 10);
export const getTrending = () => products.slice(10, 15);
export const getFlashSale = () => products.filter((p) => p.flashSale);
export const getProductById = (id) =>
  products.find((p) => p.id === parseInt(id));

// Get all products with offers (discounted products)
export const getOffers = () => {
  return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
};

// Get daily deals (time-limited offers, can be subset of flash sale or special products)
export const getDailyDeals = () => {
  // For now, return a mix of flash sale products and products with good discounts
  const flashSaleProducts = products.filter((p) => p.flashSale);
  const discountedProducts = products.filter(
    (p) => p.originalPrice && p.originalPrice > p.price && !p.flashSale
  );
  // Combine and return unique products. Put discounted products first!
  const allDeals = [...discountedProducts, ...flashSaleProducts];
  return allDeals.filter(
    (p, index, self) => index === self.findIndex((t) => t.id === p.id)
  );
};

// Get similar/recommended products
export const getSimilarProducts = (currentProductId, limit = 6) => {
  const currentProduct = getProductById(currentProductId);
  if (!currentProduct) return [];

  // Filter out current product
  let similar = products.filter((p) => p.id !== currentProduct.id);

  // Try to find products in similar price range (±30%)
  const priceRange = {
    min: currentProduct.price * 0.7,
    max: currentProduct.price * 1.3,
  };

  // First, try to get products in similar price range
  let priceSimilar = similar.filter(
    (p) => p.price >= priceRange.min && p.price <= priceRange.max
  );

  // If we have enough products in price range, use them
  if (priceSimilar.length >= limit) {
    // Sort by price descending to add variety, instead of random which causes re-renders
    return priceSimilar.sort((a, b) => b.price - a.price).slice(0, limit);
  }

  // Otherwise, mix price-similar with other products
  const remaining = limit - priceSimilar.length;
  const otherProducts = similar
    .filter((p) => !priceSimilar.some((ps) => ps.id === p.id))
    .sort((a, b) => b.id - a.id) // Sort by newest instead of random
    .slice(0, remaining);

  return [...priceSimilar, ...otherProducts].slice(0, limit);
};

// Get new arrivals (products marked as new)
export const getNewArrivals = (limit = 8) => {
  return products.filter((p) => p.isNewArrival).slice(0, limit);
};

export const getAllNewArrivals = () => products.filter((p) => p.isNewArrival);

// Get recommended products based on user behavior
export const getRecommendedProducts = (limit = 6) => {
  // Try to get wishlist and cart data from localStorage
  let wishlistItems = [];
  let cartItems = [];

  try {
    const wishlistStorage = localStorage.getItem("wishlist-storage");
    if (wishlistStorage) {
      const parsed = JSON.parse(wishlistStorage);
      wishlistItems = parsed.state?.items || [];
    }

    const cartStorage = localStorage.getItem("cart-storage");
    if (cartStorage) {
      const parsed = JSON.parse(cartStorage);
      cartItems = parsed.state?.items || [];
    }
  } catch (error) {
    // If localStorage access fails, continue with empty arrays
  }

  let recommended = [];
  const usedIds = new Set();

  // 1. Get products similar to wishlist items
  if (wishlistItems.length > 0) {
    wishlistItems.forEach((item) => {
      const similar = getSimilarProducts(item.id, 2);
      similar.forEach((product) => {
        if (
          !usedIds.has(product.id) &&
          !wishlistItems.some((w) => w.id === product.id)
        ) {
          recommended.push(product);
          usedIds.add(product.id);
        }
      });
    });
  }

  // 2. Get products similar to cart items
  if (cartItems.length > 0) {
    cartItems.forEach((item) => {
      const similar = getSimilarProducts(item.id, 2);
      similar.forEach((product) => {
        if (
          !usedIds.has(product.id) &&
          !cartItems.some((c) => c.id === product.id)
        ) {
          recommended.push(product);
          usedIds.add(product.id);
        }
      });
    });
  }

  // 3. Fill remaining slots with trending products
  const trending = getTrending();
  trending.forEach((product) => {
    if (recommended.length < limit && !usedIds.has(product.id)) {
      recommended.push(product);
      usedIds.add(product.id);
    }
  });

  // 4. Fill remaining slots with popular products
  if (recommended.length < limit) {
    const popular = getMostPopular();
    popular.forEach((product) => {
      if (recommended.length < limit && !usedIds.has(product.id)) {
        recommended.push(product);
        usedIds.add(product.id);
      }
    });
  }

  // 5. If still not enough, add any remaining products
  if (recommended.length < limit) {
    products.forEach((product) => {
      if (recommended.length < limit && !usedIds.has(product.id)) {
        recommended.push(product);
        usedIds.add(product.id);
      }
    });
  }

  // Return products in their determined priority order (wishlist -> cart -> trending -> popular)
  // No random shuffle to maintain stability across renders
  return recommended.slice(0, limit);
};

// Get all products
export const getAllProducts = () => products;

export const getProductsByBrand = (brandId) => {
  return products.filter((p) => p.brandId === parseInt(brandId));
};

export const getProductsByVendor = (vendorId) => {
  const targetId = String(vendorId ?? "").trim();
  return products.filter((p) => String(p.vendorId ?? "").trim() === targetId);
};
