import { FiShoppingBag } from "react-icons/fi";
import { formatPrice } from "../../../../shared/utils/helpers";
import { formatVariantLabel, getVariantSignature } from "../../../../shared/utils/variant";

const OrderSummary = ({ itemsByVendor, total, discount, shipping, tax, finalTotal }) => {
  return (
    <div className="bg-[#fdeade]/30 border border-[#e9d7cb] rounded-xl p-4">
      <h3 className="text-base font-bold text-[#231a13] mb-3">Order Summary</h3>
      <div className="space-y-4 mb-6">
        {itemsByVendor.map((vendorGroup) => (
          <div key={vendorGroup.vendorId} className="space-y-3 mb-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#e9d7cb]/70">
              <FiShoppingBag className="text-[#8d4b00] text-sm" />
              <span className="text-xs font-bold text-[#8d4b00] uppercase tracking-wider flex-1">{vendorGroup.vendorName}</span>
              <span className="text-xs font-bold text-[#231a13]">
                {formatPrice(vendorGroup.subtotal)}
              </span>
            </div>
            <div className="space-y-3 pl-2">
              {vendorGroup.items.map((item, itemIndex) => (
                <div
                  key={`${item.id}-${itemIndex}-${getVariantSignature(item?.variant || {})}`}
                  className="flex items-center gap-3 text-xs"
                >
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-[#e9d7cb]/50" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#231a13] truncate text-sm mb-0.5">{item.name}</p>
                    <p className="text-[#554336] text-xs font-medium">
                      <span className="text-[#8d4b00] font-bold">{formatPrice(item.price)}</span> x {item.quantity}
                    </p>
                    {formatVariantLabel(item?.variant) && (
                      <p className="text-[11px] text-[#554336]/80 mt-0.5">{formatVariantLabel(item?.variant)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm pt-4 border-t border-[#e9d7cb]/70">
        <div className="flex justify-between text-[#554336] font-medium">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[#554336] font-medium">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? <span className="text-green-600 font-bold tracking-wide">FREE</span> : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-[#554336] font-medium">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-[#231a13] pt-3 border-t border-[#e9d7cb]">
          <span>Total</span>
          <span className="text-[#8d4b00] font-extrabold">{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;

