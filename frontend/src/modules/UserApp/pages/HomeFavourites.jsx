import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHeart } from "react-icons/fi";
import MobileLayout from "../components/Layout/MobileLayout";
import PageTransition from "../../../shared/components/PageTransition";

const circleCategories = [
  { name: "Home Decor", image: "/images/redesign/media__1783408500942.png", link: "/category/6" },
  { name: "Kitchen & Dining", image: "/images/redesign/fish_artwork.png", link: "/category/6" },
  { name: "Furniture", image: "/images/artwork/media__1783761276765.jpg", link: "/category/6" },
  { name: "Vintage Rugs", image: "/images/artwork/media__1783761267381.jpg", link: "/category/6" },
  { name: "Lighting", image: "/images/artwork/media__1783761273006.jpg", link: "/category/6" },
  { name: "Bedding", image: "/images/redesign/media__1783408531215.png", link: "/category/6" },
  { name: "Artisanal Dinnerware", image: "/images/redesign/media__1783408531242.png", link: "/category/6" },
  { name: "Creative Framing", image: "/images/redesign/media__1783408500942.png", link: "/category/6" },
  { name: "Unique Wall Art", image: "/images/artwork/media__1783761276765.jpg", link: "/category/6" },
  { name: "Home Improvement", image: "/images/artwork/media__1783761267381.jpg", link: "/category/6" },
  { name: "Curtains & Window", image: "/images/artwork/media__1783761273006.jpg", link: "/category/6" },
  { name: "Storage & Org", image: "/images/redesign/media__1783408531215.png", link: "/category/6" },
  { name: "Bathroom", image: "/images/redesign/media__1783408531242.png", link: "/category/6" },
  { name: "Outdoor & Garden", image: "/images/redesign/media__1783408500942.png", link: "/category/6" },
  { name: "Student Decor", image: "/images/artwork/media__1783761276765.jpg", link: "/category/6" },
  { name: "Personalised Home", image: "/images/artwork/media__1783761267381.jpg", link: "/category/6" },
  { name: "Candles & Fragrance", image: "/images/artwork/media__1783761273006.jpg", link: "/category/6" },
  { name: "Vintage Home Decor", image: "/images/redesign/media__1783408531215.png", link: "/category/6" }
];

const smallShops = [
  {
    name: "Heritage Woodcarvers",
    rating: "4.9 (124 reviews)",
    mainImage: "/images/redesign/media__1783408500942.png",
    subImage1: "/images/artwork/media__1783761276765.jpg",
    subImage2: "/images/artwork/media__1783761267381.jpg",
    link: "/brand/heritage-woodcarvers"
  },
  {
    name: "Amritsar Fine Arts",
    rating: "5.0 (82 reviews)",
    mainImage: "/images/redesign/fish_artwork.png",
    subImage1: "/images/artwork/media__1783761273006.jpg",
    subImage2: "/images/redesign/media__1783408531215.png",
    link: "/brand/amritsar-fine-arts"
  },
  {
    name: "Sikh Heritage Weaves",
    rating: "4.8 (95 reviews)",
    mainImage: "/images/redesign/media__1783408531215.png",
    subImage1: "/images/redesign/media__1783408531242.png",
    subImage2: "/images/redesign/media__1783408500942.png",
    link: "/brand/sikh-heritage-weaves"
  }
];

const HomeFavourites = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <MobileLayout fullWidth={true}>
        <div className="w-full min-h-screen bg-white pb-16 font-sans">
          
          {/* Back button container */}
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-semibold text-black hover:text-[#F5A623] transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 stroke-[3]" />
              <span>Back</span>
            </button>
          </div>

          {/* Guide Banner Section (Etsy Luxury Navy Style) */}
          <div className="bg-[#0f1d3a] text-white py-12 px-6 text-center mt-4">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-3">
                Sikh Street's Guide to Home
              </h1>
              <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed max-w-xl mx-auto">
                Discover original wall art, comfy bedding, unique lighting, and more from small shops.
              </p>
            </div>
          </div>

          {/* Circle Category Grid */}
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-8 justify-items-center">
              {circleCategories.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(item.link)}
                  className="flex flex-col items-center cursor-pointer group text-center w-full max-w-[120px]"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gray-200/50 shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-[1.03] bg-white relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <span className="text-xs md:text-sm font-medium text-black group-hover:text-[#F5A623] transition-colors mt-3 flex items-center gap-1 justify-center leading-tight">
                    {item.name} <span className="text-[10px] transform translate-y-[1px] group-hover:translate-x-0.5 transition-transform duration-300">→</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Discover Small Shops Section */}
          <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-gray-200/60">
            <h2 className="text-2xl font-bold text-black mb-8 text-center md:text-left">
              Discover small shops
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {smallShops.map((shop, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(shop.link)}
                  className="bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer group transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image collage layout */}
                  <div className="grid grid-cols-3 gap-2 aspect-[16/10] rounded-xl overflow-hidden mb-4">
                    {/* Main left image */}
                    <div className="col-span-2 h-full overflow-hidden bg-gray-50 border-r border-gray-100">
                      <img
                        src={shop.mainImage}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    {/* Two split right images */}
                    <div className="col-span-1 flex flex-col gap-2 h-full">
                      <div className="flex-1 overflow-hidden bg-gray-50">
                        <img
                          src={shop.subImage1}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 overflow-hidden bg-gray-50 border-t border-gray-100">
                        <img
                          src={shop.subImage2}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shop Details */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900 group-hover:text-[#F5A623] transition-colors leading-snug">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="text-xs text-gray-500 font-medium">{shop.rating}</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors bg-white/50 flex items-center justify-center">
                      <FiHeart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </MobileLayout>
    </PageTransition>
  );
};

export default HomeFavourites;
