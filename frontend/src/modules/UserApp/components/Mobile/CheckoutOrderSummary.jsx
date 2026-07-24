import { FiShoppingBag } from "react-icons/fi";
import { formatPrice } from "../../../../shared/utils/helpers";
import { formatVariantLabel, getVariantSignature } from "../../../../shared/utils/variant";

const OrderSummary = ({ itemsByVendor, total, discount, shipping, tax, finalTotal }) => {
  return (
    <div className="bg-white/30 border border-black/10 rounded-xl p-4">
      <h3 className="text-base font-bold text-black mb-3">Order Summary</h3>
      <div className="space-y-4 mb-6">
        {itemsByVendor.map((vendorGroup) => (
          <div key={vendorGroup.vendorId} className="space-y-3 mb-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/10">
              <FiShoppingBag className="text-black text-sm" />
              <span className="text-xs font-bold text-black uppercase tracking-wider flex-1">{vendorGroup.vendorName}</span>
              <span className="text-xs font-bold text-black">
                {formatPrice(vendorGroup.subtotal)}
              </span>
            </div>
            <div className="space-y-3 pl-2">
              {vendorGroup.items.map((item, itemIndex) => (
                <div
                  key={`${item.id}-${itemIndex}-${getVariantSignature(item?.variant || {})}`}
                  className="flex items-center gap-3 text-xs"
                >
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-black/10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-black truncate text-sm mb-0.5">{item.name}</p>
                    <p className="text-black text-xs font-medium">
                      <span className="text-black font-bold">{formatPrice(item.price)}</span> x {item.quantity}
                    </p>
                    {formatVariantLabel(item?.variant) && (
                      <p className="text-[11px] text-black/80 mt-0.5">{formatVariantLabel(item?.variant)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm pt-4 border-t border-black/10">
        <div className="flex justify-between text-black font-medium">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-black font-medium">
          <span>Shipping</span>
          <span>
            {shipping === 0 ? <span className="text-green-600 font-bold tracking-wide">FREE</span> : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between text-black font-medium">
          <span>Tax</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-black pt-3 border-t border-black/10">
          <span>Total</span>
          <span className="text-black font-extrabold">{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;

