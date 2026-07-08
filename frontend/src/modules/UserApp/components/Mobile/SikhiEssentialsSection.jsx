import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaKhanda } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

// Import available images that fit the theme
import turbanImg from "../../../../../data/products/black-turban.avif";
import karaImg from "../../../../../data/products/stylish kara.png";
import kurtaImg from "../../../../../data/products/men_blackKurta-removebg-preview.png";
import redTurban from "../../../../../data/products/red_turban-removebg-preview.png";
import beltImg from "../../../../../data/products/belt.png";

const SikhiEssentialsSection = () => {
  return (
    <div className="w-full bg-[#fcfcfc] py-12 md:py-16 overflow-hidden relative border-y border-gray-100">
      {/* Optional faint background texture or pattern can go here */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 20 20\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\' fill-rule=\\'evenodd\\'%3E%3Ccircle cx=\\'3\\' cy=\\'3\\' r=\\'3\\'/%3E%3Ccircle cx=\\'13\\' cy=\\'13\\' r=\\'3\\'/%3E%3C/g%3E%3C/svg%3E')" }}></div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12 relative z-10">
        
        {/* Left Side: Text & CTA */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 font-heading">
              Sikhi
            </h2>
            <FaKhanda className="text-3xl md:text-4xl text-gray-900" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 font-heading mb-6">
            Essentials
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
            Explore a curated collection of sikhi items that celebrate the rich heritage and spiritual practices of Sikhism. Each item is carefully selected to honor Sikh traditions, making it perfect for your daily needs.
          </p>
          
          <Link
            to="/category/sikhi"
            className="inline-flex items-center gap-2 text-gray-900 font-bold text-lg hover:underline underline-offset-8 decoration-2 decoration-gray-900 transition-all group"
          >
            View Collection
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right Side: Scattered Polaroids */}
        <div className="flex-1 relative h-[400px] md:h-[500px] w-full mt-8 md:mt-0 flex justify-center items-center perspective-1000">
          
          {/* Item 1 */}
          <div className="absolute top-[10%] left-[10%] md:left-[5%] w-32 md:w-40 bg-white p-2 md:p-3 shadow-xl transform -rotate-12 hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300">
            <div className="bg-gray-100 aspect-square w-full mb-2 overflow-hidden flex items-center justify-center">
              <img src={redTurban} alt="Red Turban" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Item 2 */}
          <div className="absolute top-[5%] right-[20%] md:right-[30%] w-36 md:w-44 bg-white p-2 md:p-3 shadow-xl transform rotate-6 hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300">
            <div className="bg-gray-100 aspect-square w-full mb-2 overflow-hidden flex items-center justify-center">
              <img src={karaImg} alt="Kara" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Item 3 */}
          <div className="absolute top-[40%] right-[5%] md:right-[5%] w-40 md:w-48 bg-white p-2 md:p-3 shadow-2xl transform rotate-[15deg] hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300 z-10">
            <div className="bg-gray-100 aspect-square w-full mb-2 overflow-hidden flex items-center justify-center">
              <img src={turbanImg} alt="Black Turban" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Item 4 */}
          <div className="absolute bottom-[10%] left-[20%] md:left-[15%] w-36 md:w-44 bg-white p-2 md:p-3 shadow-xl transform -rotate-6 hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300 z-20">
            <div className="bg-gray-100 aspect-[3/4] w-full mb-2 overflow-hidden flex items-center justify-center">
              <img src={kurtaImg} alt="Kurta" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Item 5 */}
          <div className="absolute bottom-[5%] right-[25%] md:right-[25%] w-32 md:w-40 bg-white p-2 md:p-3 shadow-lg transform rotate-[-8deg] hover:rotate-0 hover:scale-110 hover:z-50 transition-all duration-300 z-30">
            <div className="bg-gray-100 aspect-square w-full mb-2 overflow-hidden flex items-center justify-center">
              <img src={beltImg} alt="Belt" className="w-[80%] h-[80%] object-contain" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SikhiEssentialsSection;
