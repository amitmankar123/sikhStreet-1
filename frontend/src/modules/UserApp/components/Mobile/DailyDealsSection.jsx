import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiClock, FiZap, FiArrowRight } from "react-icons/fi";
import ProductCard from "../../../../shared/components/ProductCard";
import { getDailyDeals } from "../../data/catalogData";

const DailyDealsSection = ({ products = null }) => {
  const fallback = getDailyDeals().slice(0, 5);
  const dailyDeals = Array.isArray(products) && products.length > 0
    ? products.slice(0, 5)
    : fallback;
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  // Countdown timer - resets daily
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay - now;

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (value) => {
    return value.toString().padStart(2, "0");
  };

  if (dailyDeals.length === 0) {
    return null;
  }

  return (
    <div className="relative py-8 text-left">
      {/* Header with clock icon and timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Today's big deals
          </h2>
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 font-normal">
            <FiClock className="stroke-[2.5] text-gray-500" />
            <span>Fresh deals in {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</span>
          </div>
        </div>
        <Link
          to="/daily-deals"
          className="text-sm font-semibold text-[#F5A623] hover:text-orange-600 transition-colors flex items-center gap-1"
        >
          See All Deals <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Horizontal Products Scroll */}
      <div className="relative">
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x">
          {dailyDeals.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-[200px] md:w-[250px] shrink-0 snap-start"
            >
              <ProductCard product={product} isFlashSale={true} />
            </motion.div>
          ))}
          {dailyDeals.length < 3 && (
            <div className="w-[200px] md:w-[250px] shrink-0 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 p-6 text-center">
              <FiZap className="text-3xl mb-2 text-[#F5A623] animate-bounce" />
              <p className="font-semibold text-xs">More deals coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyDealsSection;
