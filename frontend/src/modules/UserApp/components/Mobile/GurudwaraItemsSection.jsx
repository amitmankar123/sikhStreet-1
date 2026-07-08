import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LazyImage from "../../../../shared/components/LazyImage";
import { getPlaceholderImage } from "../../../../shared/utils/helpers";

const items = [
  {
    name: "Chabba Sahib",
    image: getPlaceholderImage(300, 300, "Chabba Sahib"),
    rotate: "-12deg",
    translateY: "20px",
    zIndex: 1,
  },
  {
    name: "Palki Sahib",
    image: getPlaceholderImage(300, 300, "Palki Sahib"),
    rotate: "4deg",
    translateY: "5px",
    zIndex: 2,
  },
  {
    name: "Chaur Sahib",
    image: getPlaceholderImage(300, 300, "Chaur Sahib"),
    rotate: "12deg",
    translateY: "25px",
    zIndex: 3,
  },
  {
    name: "Gutka Stands",
    image: getPlaceholderImage(300, 300, "Gutka Stands"),
    rotate: "-8deg",
    translateY: "15px",
    zIndex: 4,
  },
  {
    name: "Rumala Sahib",
    image: getPlaceholderImage(300, 300, "Rumala Sahib"),
    rotate: "6deg",
    translateY: "-5px",
    zIndex: 5,
  },
  {
    name: "Sarabloh Utensils",
    image: getPlaceholderImage(300, 300, "Sarabloh"),
    rotate: "-5deg",
    translateY: "25px",
    zIndex: 6,
  },
];

const GurudwaraItemsSection = () => {
  return (
    <div className="relative w-full py-16 overflow-hidden bg-[#FAFAFA]">
      {/* Optional faint background texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        
        {/* Polaroids Container */}
        <div className="flex justify-center items-center flex-wrap gap-4 md:gap-0 md:-space-x-4 lg:-space-x-2 pt-8 pb-12">
          {items.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 50, rotate: 0 }}
              whileInView={{ 
                opacity: 1, 
                y: item.translateY, 
                rotate: item.rotate 
              }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: index * 0.1, type: "spring", bounce: 0.3 }}
              className="group cursor-pointer hover:z-[50] transition-all duration-300"
              style={{ zIndex: item.zIndex }}
            >
              <Link to={`/search?category=${item.name.toLowerCase().replace(' ', '-')}`}>
                <div className="bg-white p-2 pb-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 hover:scale-110 hover:shadow-2xl transition-all duration-300 w-32 md:w-40 lg:w-48 xl:w-56">
                  {/* Image wrapper */}
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                    <LazyImage 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  {/* Label area */}
                  <div className="bg-[#2A2420] mt-2 mb-2 p-3 text-center">
                    <span className="text-white text-[10px] md:text-xs font-semibold tracking-wider font-sans">
                      {item.name}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Text Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12 md:mt-16"
        >
          <p className="text-xs md:text-sm tracking-[0.25em] text-gray-500 uppercase font-semibold mb-2 md:mb-3">
            Our Exclusive Selection of
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#15294D] uppercase tracking-tighter" style={{ fontFamily: 'Oswald, impact, sans-serif' }}>
            Gurudwara Items
          </h2>
        </motion.div>

      </div>
    </div>
  );
};

export default GurudwaraItemsSection;
