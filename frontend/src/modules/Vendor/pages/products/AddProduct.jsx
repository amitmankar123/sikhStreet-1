import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSave, FiUpload, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import { useVendorAuthStore } from "../../store/vendorAuthStore";
import { useVendorProductStore } from "../../store/vendorProductStore";
import { useCategoryStore } from "../../../../shared/store/categoryStore";
import { useBrandStore } from "../../../../shared/store/brandStore";
import { uploadVendorImage, uploadVendorImages } from "../../services/vendorService";
import CategorySelector from "../../../Admin/components/CategorySelector";
import AnimatedSelect from "../../../Admin/components/AnimatedSelect";
import toast from "react-hot-toast";
import {
  parseVariantAxis,
  buildVariantCombinations,
  syncVariantPricesWithAxes,
  buildVariantPayload,
} from "../../utils/variantHelpers";

// --- Dynamic Variant Input Panels ---
const DimensionInputPanel = ({ onAdd }) => {
  const [dimType, setDimType] = useState("2d"); // "2d" (Length & Width) or "1d" (Only Length)
  const [unit, setUnit] = useState("inches"); // "inches", "cm", "meter", "feet"
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // When dimType changes, auto-update the selected unit to match the valid set
  useEffect(() => {
    if (dimType === "2d") {
      setUnit("inches");
    } else {
      setUnit("meter");
    }
  }, [dimType]);

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmedLen = length.trim();
    const trimmedWidth = width.trim();
    if (!trimmedLen) {
      toast.error("Please enter length");
      return;
    }
    if (dimType === "2d" && !trimmedWidth) {
      toast.error("Please enter width");
      return;
    }

    let formatted = "";
    if (dimType === "2d") {
      formatted = `${trimmedLen}x${trimmedWidth} ${unit}`;
    } else {
      formatted = `${trimmedLen} ${unit}`;
    }
    onAdd(formatted, price, stock);
    setLength("");
    setWidth("");
    setPrice("");
    setStock("");
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 mt-2">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-700">Type:</span>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="dimType"
              value="2d"
              checked={dimType === "2d"}
              onChange={() => setDimType("2d")}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span>Length & Width</span>
          </label>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="dimType"
              value="1d"
              checked={dimType === "1d"}
              onChange={() => setDimType("1d")}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span>Only Length</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">SI Unit:</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-xs font-semibold text-gray-700"
          >
            {dimType === "2d" ? (
              <>
                <option value="inches">inches</option>
                <option value="cm">cm</option>
              </>
            ) : (
              <>
                <option value="meter">meter</option>
                <option value="feet">feet</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          type="number"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          placeholder="Length"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        {dimType === "2d" ? (
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Width"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
          />
        ) : (
          <div className="hidden sm:block"></div>
        )}
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          Add Dimension Value
        </button>
      </div>
    </div>
  );
};

const ColorInputPanel = ({ onAdd, isTurbanCategory = false, onTurbanColorAdd }) => {
  const [val, setVal] = useState("");
  const [colorHex, setColorHex] = useState("#000000");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) { toast.error("Please enter a color name"); return; }
    if (isTurbanCategory) {
      if (!price) { toast.error("Price per meter is required for each color"); return; }
      if (!imageFile) { toast.error("Photo is required for each turban color"); return; }
      onTurbanColorAdd && onTurbanColorAdd(trimmed, colorHex, price, stock, imageFile);
    } else {
      onAdd(trimmed, price, stock);
    }
    setVal(""); setColorHex("#000000"); setPrice(""); setStock("");
    setImageFile(null); setImagePreview("");
  };

  if (isTurbanCategory) {
    return (
      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 space-y-3 mt-2">
        <p className="text-xs font-semibold text-amber-700">Add Turban Color — Price &amp; Photo required <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5 bg-white flex-shrink-0"
              title="Pick color"
            />
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Color name (e.g. Royal Blue) *"
              className="flex-1 w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
            />
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price per meter (₹) *"
            className="w-full px-2.5 py-1.5 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-xs bg-white"
          />
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock in meters (optional)"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
          />
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" id="turban-color-img" className="hidden" onChange={handleImageSelect} />
            <label htmlFor="turban-color-img" className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border-2 border-dashed border-amber-400 rounded-lg cursor-pointer hover:bg-amber-100 text-xs font-medium text-amber-700 transition-colors">
              {imagePreview ? "Change Photo" : "Upload Color Photo *"}
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-9 h-9 rounded object-cover border border-amber-300" />
            )}
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button type="button" onClick={handleAdd} className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm">
            Add Turban Color
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Color name (e.g. Red)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
      </div>
      <div className="flex justify-end pt-1">
        <button type="button" onClick={handleAdd} className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          Add Color Value
        </button>
      </div>
    </div>
  );
};

// --- Turban Fabric Section ---
const FABRIC_TYPES = ["Voil", "Ruby", "Mix (Rub & Voil)"];

const TurbanFabricSection = ({ fabrics, onChange }) => {
  const [otherName, setOtherName] = useState("");
  const [otherPrice, setOtherPrice] = useState("");

  const toggleFabric = (type) => {
    const existing = fabrics.find((f) => f.type === type);
    if (existing) {
      onChange(fabrics.filter((f) => f.type !== type));
    } else {
      onChange([...fabrics, { type, price: "" }]);
    }
  };

  const updateFabricPrice = (type, price) => {
    onChange(fabrics.map((f) => f.type === type ? { ...f, price } : f));
  };

  const addOtherFabric = () => {
    const trimmed = otherName.trim();
    if (!trimmed) { toast.error("Enter a fabric name"); return; }
    if (!otherPrice) { toast.error("Enter price for this fabric"); return; }
    if (fabrics.find((f) => f.type.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This fabric already exists"); return;
    }
    onChange([...fabrics, { type: trimmed, price: otherPrice, isCustom: true }]);
    setOtherName(""); setOtherPrice("");
  };

  const removeFabric = (type) => {
    onChange(fabrics.filter((f) => f.type !== type));
  };

  return (
    <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        <h3 className="text-sm font-bold text-amber-800">Fabric Type</h3>
        <span className="text-xs text-amber-600">(Select all available fabrics and set price per meter)</span>
      </div>

      <div className="space-y-2">
        {FABRIC_TYPES.map((type) => {
          const selected = fabrics.find((f) => f.type === type);
          return (
            <div key={type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-100">
              <input
                type="checkbox"
                id={`fabric-${type}`}
                checked={!!selected}
                onChange={() => toggleFabric(type)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor={`fabric-${type}`} className="text-xs font-semibold text-gray-700 flex-1 cursor-pointer">{type}</label>
              {selected && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selected.price}
                    onChange={(e) => updateFabricPrice(type, e.target.value)}
                    placeholder="Price/meter *"
                    className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Custom fabric rows */}
        {fabrics.filter((f) => f.isCustom).map((f) => (
          <div key={f.type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-amber-200">
            <span className="text-xs font-semibold text-gray-700 flex-1">{f.type} <span className="text-amber-600 text-[10px]">(Custom)</span></span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={f.price}
                onChange={(e) => updateFabricPrice(f.type, e.target.value)}
                placeholder="Price/meter *"
                className="w-28 px-2 py-1 border border-red-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-white"
              />
            </div>
            <button type="button" onClick={() => removeFabric(f.type)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add Other Fabric */}
      <div className="border-t border-amber-200 pt-3">
        <p className="text-xs font-semibold text-amber-700 mb-2">+ Add Other Fabric Type</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="Fabric name (e.g. Silk)"
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <input
            type="number"
            value={otherPrice}
            onChange={(e) => setOtherPrice(e.target.value)}
            placeholder="₹ Price/meter *"
            className="w-32 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-xs bg-white"
          />
          <button type="button" onClick={addOtherFabric} className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap">
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Turban Advanced Config ---
const TurbanAdvancedConfig = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const update = (key, val) => onChange({ ...config, [key]: { ...config[key], ...val } });

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-sm font-bold text-indigo-800">Advanced Configuration</span>
          {(config.embroidery?.enabled || config.giftWrap?.enabled) && (
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
              {[config.embroidery?.enabled && 'Embroidery', config.giftWrap?.enabled && 'Gift Wrap'].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>

      {isOpen && (
        <div className="bg-white p-4 space-y-4 border-t border-indigo-100">
          {/* Embroidery */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.embroidery?.enabled || false}
                onChange={(e) => update('embroidery', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Embroidery Available</span>
                <p className="text-[11px] text-gray-500">Enable if embroidery can be added to this turban</p>
              </div>
            </label>
            {config.embroidery?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500">Embroidery Price (₹)</span>
                <span className="text-red-500 text-xs">*</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.embroidery?.price || ""}
                  onChange={(e) => update('embroidery', { price: e.target.value })}
                  placeholder="e.g. 250"
                  className="w-36 px-2.5 py-1.5 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100" />

          {/* Gift Wrapper */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.giftWrap?.enabled || false}
                onChange={(e) => update('giftWrap', { enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-800">Gift Wrapper Available</span>
                <p className="text-[11px] text-gray-500">Enable if gift wrapping service is offered</p>
              </div>
            </label>
            {config.giftWrap?.enabled && (
              <div className="ml-7 flex items-center gap-2">
                <span className="text-xs text-gray-500">Gift Wrap Price (₹)</span>
                <span className="text-red-500 text-xs">*</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.giftWrap?.price || ""}
                  onChange={(e) => update('giftWrap', { price: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-36 px-2.5 py-1.5 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs bg-white"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SizeInputPanel = ({ onAdd }) => {
  const [val, setVal] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) {
      toast.error("Please enter a size value");
      return;
    }
    onAdd(trimmed, price, stock);
    setVal("");
    setPrice("");
    setStock("");
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Size name (e.g. XL, 10)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
      </div>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          Add Size Value
        </button>
      </div>
    </div>
  );
};

const CustomAttributeInputPanel = ({ onAdd }) => {
  const [val, setVal] = useState("");
  const [price, setPrice] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) {
      toast.error("Please enter a value");
      return;
    }
    onAdd(trimmed, price, ""); // stock always empty for custom attributes
    setVal("");
    setPrice("");
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Option value (e.g. Gold, 8GB)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (optional)"
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
        />
      </div>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          Add Value
        </button>
      </div>
    </div>
  );
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { vendor } = useVendorAuthStore();
  const { addProduct, isSaving } = useVendorProductStore();
  const { categories, initialize: initCategories } = useCategoryStore();
  const { brands, initialize: initBrands } = useBrandStore();

  const vendorId = vendor?.id;

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [],
    categoryId: null,
    subcategoryId: null,
    brandId: null,
    stock: "in_stock",
    stockQuantity: "",
    totalAllowedQuantity: "",
    minimumOrderQuantity: "",
    warrantyPeriod: "",
    guaranteePeriod: "",
    hsnCode: "",
    flashSale: false,
    isNewArrival: false,
    isFeatured: false,
    isVisible: true,
    codAllowed: true,
    returnable: true,
    cancelable: true,
    taxIncluded: false,
    description: "",
    tags: [],
    variants: {
      sizes: [],
      colors: [],
      materials: [],
      attributes: [],
      prices: {},
      stockMap: {},
      imageMap: {},
      colorHexMap: {},
      defaultVariant: {},
      defaultSelection: {},
    },
    seoTitle: "",
    seoDescription: "",
    relatedProducts: [],
    faqs: [],
    turbanConfig: {
      fabric: [],
      embroidery: { enabled: false, price: "" },
      giftWrap: { enabled: false, price: "" },
    },
  });
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [variantAxisInput, setVariantAxisInput] = useState({
    sizes: "",
    colors: "",
  });
  const variantCombinations = useMemo(
    () =>
      buildVariantCombinations(
        formData.variants?.sizes || [],
        formData.variants?.colors || [],
        formData.variants?.attributes || []
      ),
    [formData.variants?.sizes, formData.variants?.colors, formData.variants?.attributes]
  );

  useEffect(() => {
    initCategories();
    initBrands();
  }, [initCategories, initBrands]);

  useEffect(() => {
    if (!vendorId) {
      toast.error("Please log in to add products");
      navigate("/vendor/login");
    }
  }, [vendorId, navigate]);


  const isTurbanCategory = useMemo(() => {
    let match = false;
    if (formData.categoryId && categories?.length > 0) {
      const selectedCategory = categories.find(
        (c) => String(c.id || c._id) === String(formData.categoryId)
      );
      if (selectedCategory && selectedCategory.name.toLowerCase().includes("turban")) {
        match = true;
      }
    }
    if (formData.subcategoryId && categories?.length > 0) {
      const selectedSubcategory = categories.find(
        (c) => String(c.id || c._id) === String(formData.subcategoryId)
      );
      if (selectedSubcategory && selectedSubcategory.name.toLowerCase().includes("turban")) {
        match = true;
      }
    }
    return match;
  }, [formData.categoryId, formData.subcategoryId, categories]);

  const isKadaCategory = useMemo(() => {
    let match = false;
    if (formData.name && (formData.name.toLowerCase().includes("kada") || formData.name.toLowerCase().includes("bangle"))) {
      match = true;
    }
    if (formData.categoryId && categories?.length > 0) {
      const selectedCategory = categories.find(
        (c) => String(c.id || c._id) === String(formData.categoryId)
      );
      if (selectedCategory && (selectedCategory.name.toLowerCase().includes("kada") || selectedCategory.name.toLowerCase().includes("bangle"))) {
        match = true;
      }
    }
    if (formData.subcategoryId && categories?.length > 0) {
      const selectedSubcategory = categories.find(
        (c) => String(c.id || c._id) === String(formData.subcategoryId)
      );
      if (selectedSubcategory && (selectedSubcategory.name.toLowerCase().includes("kada") || selectedSubcategory.name.toLowerCase().includes("bangle"))) {
        match = true;
      }
    }
    return match;
  }, [formData.name, formData.categoryId, formData.subcategoryId, categories]);


  useEffect(() => {
    if (isTurbanCategory) {
      setFormData((prev) => ({ ...prev, unit: "Meter" }));
    } else if (isKadaCategory) {
      setFormData((prev) => ({ ...prev, unit: "Diameter" }));
    }
  }, [isTurbanCategory, isKadaCategory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setIsUploadingMedia(true);
      try {
        const res = await uploadVendorImage(file, "vendors/products");
        const uploaded = res?.data ?? res;
        setFormData((prev) => ({
          ...prev,
          image: uploaded?.url || "",
        }));
        toast.success("Main image uploaded");
      } catch {
        // errors handled by api.js
      } finally {
        setIsUploadingMedia(false);
      }
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} size should be less than 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploadingMedia(true);
    try {
      const res = await uploadVendorImages(validFiles, "vendors/products");
      const uploaded = res?.data ?? res;
      const uploadedUrls = Array.isArray(uploaded)
        ? uploaded.map((u) => u?.url).filter(Boolean)
        : [];

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      toast.success(`${uploadedUrls.length} image(s) added to gallery`);
    } catch {
      // errors handled by api.js
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleFaqChange = (index, field, value) => {
    setFormData((prev) => {
      const nextFaqs = [...(prev.faqs || [])];
      nextFaqs[index] = {
        ...(nextFaqs[index] || { question: "", answer: "" }),
        [field]: value,
      };
      return { ...prev, faqs: nextFaqs };
    });
  };

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index),
    }));
  };

  const updateVariantAxes = (axis, rawText) => {
    const parsed = parseVariantAxis(rawText);
    const nextSizes = axis === "sizes" ? parsed : (formData.variants?.sizes || []);
    const nextColors = axis === "colors" ? parsed : (formData.variants?.colors || []);
    const synced = syncVariantPricesWithAxes(
      formData.variants?.prices || {},
      formData.variants?.stockMap || {},
      formData.variants?.imageMap || {},
      nextSizes,
      nextColors,
      formData.variants?.attributes || [],
      formData.price
    );

    setFormData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        sizes: nextSizes,
        colors: nextColors,
        prices: synced.prices,
        stockMap: synced.stockMap,
        imageMap: synced.imageMap,
        defaultVariant: {
          size: String(prev.variants?.defaultVariant?.size || ""),
          color: String(prev.variants?.defaultVariant?.color || ""),
        },
      },
    }));
  };

  const updateVariantAttributes = (nextAttributes) => {
    const synced = syncVariantPricesWithAxes(
      formData.variants?.prices || {},
      formData.variants?.stockMap || {},
      formData.variants?.imageMap || {},
      formData.variants?.sizes || [],
      formData.variants?.colors || [],
      nextAttributes,
      formData.price
    );

    setFormData((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        attributes: nextAttributes,
        prices: synced.prices,
        stockMap: synced.stockMap,
        imageMap: synced.imageMap,
      },
    }));
  };

  const addAttributeRow = () => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    updateVariantAttributes([...current, { name: "", values: [] }]);
  };

  const removeAttributeRow = (index) => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    updateVariantAttributes(current.filter((_, i) => i !== index));
  };

  const updateAttributeName = (index, name) => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const next = [...current];
    next[index] = { ...(next[index] || {}), name: String(name || "") };
    updateVariantAttributes(next);
  };

  const updateAttributeValues = (index, rawValues) => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const next = [...current];
    const values = parseVariantAxis(rawValues);
    next[index] = { ...(next[index] || {}), values };
    updateVariantAttributes(next);
  };

  const getCombinationKeyForSingleValue = (attributeName, value) => {
    const axisKey = String(attributeName || "").toLowerCase().trim().replace(/\s+/g, "_");
    const normalizedVal = String(value || "").trim().toLowerCase();
    return `${axisKey}=${normalizedVal}`;
  };

  const handleAddValueWithPriceStock = (index, value, price, stock) => {
    if (!value || String(value).trim() === "") return;
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const next = [...current];
    const attributeName = next[index]?.name;
    if (!attributeName) return;

    const existingValues = next[index]?.values || [];
    if (!existingValues.includes(value)) {
      next[index] = {
        ...next[index],
        values: [...existingValues, value],
      };

      const comboKey = getCombinationKeyForSingleValue(attributeName, value);

      const updatedPrices = {
        ...(formData.variants?.prices || {}),
      };
      if (price !== undefined && price !== "") {
        updatedPrices[comboKey] = Number(price);
      }

      const updatedStock = {
        ...(formData.variants?.stockMap || {}),
      };
      if (stock !== undefined && stock !== "") {
        updatedStock[comboKey] = Number(stock);
      }

      const synced = syncVariantPricesWithAxes(
        updatedPrices,
        updatedStock,
        formData.variants?.imageMap || {},
        formData.variants?.sizes || [],
        formData.variants?.colors || [],
        next,
        formData.price
      );

      setFormData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          attributes: next,
          prices: synced.prices,
          stockMap: synced.stockMap,
          imageMap: synced.imageMap,
        },
      }));
    }
  };

  // Turban color add: uploads image then stores color+hex+price+stock
  const handleTurbanColorAdd = async (colorName, colorHex, price, stock, imageFile) => {
    if (!colorName) return;
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const colorAttrIdx = current.findIndex((a) => a.name === "Color");
    if (colorAttrIdx === -1) return;

    const existingValues = current[colorAttrIdx]?.values || [];
    if (existingValues.includes(colorName)) {
      toast.error(`Color "${colorName}" already added`);
      return;
    }

    setIsUploadingMedia(true);
    try {
      const res = await uploadVendorImage(imageFile, "vendors/products/variants");
      const uploaded = res?.data ?? res;
      const imageUrl = uploaded?.url || "";
      if (!imageUrl) { toast.error("Image upload failed"); return; }

      const comboKey = getCombinationKeyForSingleValue("Color", colorName);
      const next = [...current];
      next[colorAttrIdx] = { ...next[colorAttrIdx], values: [...existingValues, colorName] };

      const updatedPrices = { ...(formData.variants?.prices || {}) };
      if (price && price !== "") updatedPrices[comboKey] = Number(price);

      const updatedStock = { ...(formData.variants?.stockMap || {}) };
      if (stock && stock !== "") updatedStock[comboKey] = Number(stock);

      const updatedImageMap = { ...(formData.variants?.imageMap || {}), [comboKey]: imageUrl };
      const updatedColorHexMap = { ...(formData.variants?.colorHexMap || {}), [colorName]: colorHex };

      const synced = syncVariantPricesWithAxes(
        updatedPrices, updatedStock, updatedImageMap,
        formData.variants?.sizes || [], formData.variants?.colors || [], next, formData.price
      );

      setFormData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          attributes: next,
          prices: synced.prices,
          stockMap: synced.stockMap,
          imageMap: synced.imageMap,
          colorHexMap: updatedColorHexMap,
        },
      }));
      toast.success(`Color "${colorName}" added`);
    } catch {
      // api interceptor handles error toast
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const removeAttributeValue = (index, valueToRemove) => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const next = [...current];
    if (next[index]) {
      const attributeName = next[index].name;
      next[index] = {
        ...next[index],
        values: (next[index].values || []).filter((v) => v !== valueToRemove),
      };

      const comboKey = getCombinationKeyForSingleValue(attributeName, valueToRemove);

      const updatedPrices = { ...(formData.variants?.prices || {}) };
      delete updatedPrices[comboKey];

      const updatedStock = { ...(formData.variants?.stockMap || {}) };
      delete updatedStock[comboKey];

      const synced = syncVariantPricesWithAxes(
        updatedPrices,
        updatedStock,
        formData.variants?.imageMap || {},
        formData.variants?.sizes || [],
        formData.variants?.colors || [],
        next,
        formData.price
      );

      setFormData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          attributes: next,
          prices: synced.prices,
          stockMap: synced.stockMap,
          imageMap: synced.imageMap,
        },
      }));
    }
  };

  const addPredefinedAttribute = (name) => {
    const current = Array.isArray(formData.variants?.attributes) ? formData.variants.attributes : [];
    const exists = current.some((attr) => attr.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast.error(`Attribute "${name}" already exists!`);
      return;
    }
    updateVariantAttributes([...current, { name, values: [] }]);
  };

  const addVariantAxisValues = (axis, rawInput) => {
    const parsed = parseVariantAxis(rawInput);
    if (!parsed.length) return;
    const current = Array.isArray(formData?.variants?.[axis]) ? formData.variants[axis] : [];
    const merged = parseVariantAxis([...current, ...parsed].join(", "));
    updateVariantAxes(axis, merged.join(", "));
    setVariantAxisInput((prev) => ({ ...prev, [axis]: "" }));
  };

  const removeVariantAxisValue = (axis, valueToRemove) => {
    const current = Array.isArray(formData?.variants?.[axis]) ? formData.variants[axis] : [];
    const next = current.filter((value) => String(value) !== String(valueToRemove));
    updateVariantAxes(axis, next.join(", "));
  };

  const handleVariantAxisInputKeyDown = (axis, e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addVariantAxisValues(axis, variantAxisInput[axis]);
    }
  };

  const handleVariantImageUpload = async (variantKey, file) => {
    if (!file || !variantKey) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingMedia(true);
    try {
      const res = await uploadVendorImage(file, "vendors/products/variants");
      const uploaded = res?.data ?? res;
      const imageUrl = uploaded?.url || "";
      if (!imageUrl) return;
      setFormData((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          imageMap: {
            ...(prev.variants?.imageMap || {}),
            [variantKey]: imageUrl,
          },
        },
      }));
      toast.success("Variant image uploaded");
    } catch {
      // api interceptor handles error toast
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vendorId) {
      toast.error("Please log in to add products");
      return;
    }

    if (!formData.name || !formData.price || !formData.stockQuantity || !formData.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Turban-specific validation
    if (isTurbanCategory) {
      // Validate color attributes: each color must have price and photo
      const colorAttr = (formData.variants?.attributes || []).find((a) => a.name === "Color");
      if (colorAttr && colorAttr.values.length > 0) {
        for (const colorVal of colorAttr.values) {
          const comboKey = getCombinationKeyForSingleValue("Color", colorVal);
          if (!formData.variants?.prices?.[comboKey]) {
            toast.error(`Please enter price for color: ${colorVal}`);
            return;
          }
          if (!formData.variants?.imageMap?.[comboKey]) {
            toast.error(`Please upload a photo for color: ${colorVal}`);
            return;
          }
        }
      }
      // Validate fabric prices
      for (const fabric of (formData.turbanConfig?.fabric || [])) {
        if (!fabric.price) {
          toast.error(`Please enter price for fabric: ${fabric.type}`);
          return;
        }
      }
      // Validate advanced config prices
      if (formData.turbanConfig?.embroidery?.enabled && !formData.turbanConfig?.embroidery?.price) {
        toast.error("Please enter embroidery price");
        return;
      }
      if (formData.turbanConfig?.giftWrap?.enabled && !formData.turbanConfig?.giftWrap?.price) {
        toast.error("Please enter gift wrap price");
        return;
      }
    }

    // Determine final categoryId
    const finalCategoryId = formData.subcategoryId
      ? formData.subcategoryId
      : formData.categoryId ?? null;

    const parsedPrice = parseFloat(formData.price);
    const parsedOriginalPrice = formData.originalPrice
      ? parseFloat(formData.originalPrice)
      : null;
    const parsedStockQuantity = parseFloat(formData.stockQuantity);
    const parsedTotalAllowedQuantity = formData.totalAllowedQuantity
      ? parseFloat(formData.totalAllowedQuantity)
      : null;
    const parsedMinimumOrderQuantity = formData.minimumOrderQuantity
      ? parseFloat(formData.minimumOrderQuantity)
      : null;

    if (!Number.isFinite(parsedPrice) || !Number.isFinite(parsedStockQuantity)) {
      toast.error("Please enter valid numeric values");
      return;
    }

    const hasInvalidFaq = (formData.faqs || []).some((faq) => {
      const question = String(faq?.question || "").trim();
      const answer = String(faq?.answer || "").trim();
      return (question && !answer) || (!question && answer);
    });
    if (hasInvalidFaq) {
      toast.error("Each FAQ must have both question and answer");
      return;
    }

    const payload = {
      ...formData,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stockQuantity: parsedStockQuantity,
      totalAllowedQuantity: parsedTotalAllowedQuantity,
      minimumOrderQuantity: parsedMinimumOrderQuantity,
      warrantyPeriod: formData.warrantyPeriod || null,
      guaranteePeriod: formData.guaranteePeriod || null,
      hsnCode: formData.hsnCode || null,
      categoryId: finalCategoryId,
      subcategoryId: formData.subcategoryId ? formData.subcategoryId : null,
      brandId: formData.brandId ?? null,
      faqs: (formData.faqs || [])
        .map((faq) => ({
          question: String(faq?.question || "").trim(),
          answer: String(faq?.answer || "").trim(),
        }))
        .filter((faq) => faq.question && faq.answer),
      variants: buildVariantPayload(formData.variants || {}),
      turbanConfig: isTurbanCategory ? formData.turbanConfig : null,
    };

    const result = await addProduct(payload);
    if (result) {
      navigate("/vendor/products/manage-products");
    }
  };

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to add products</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 space-y-4">
        {/* Basic Information */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <CategorySelector
                value={formData.categoryId}
                subcategoryId={formData.subcategoryId}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit
              </label>
              <input
                list="unit-options"
                type="text"
                name="unit"
                value={isTurbanCategory ? 'Meter' : isKadaCategory ? 'Diameter' : formData.unit}
                onChange={handleChange}
                disabled={isTurbanCategory || isKadaCategory}
                placeholder="Select or type unit (e.g., Meter, Piece)"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm ${(isTurbanCategory || isKadaCategory) ? 'bg-gray-100 text-gray-500' : ''}`}
              />
              <datalist id="unit-options">
                <option value="Meter" />
                <option value="Piece" />
                <option value="Kilogram" />
                <option value="Gram" />
                <option value="Litre" />
                <option value="Pair" />
                <option value="Dozen" />
                <option value="Box" />
              </datalist>
            </div>



            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand
              </label>
              <AnimatedSelect
                name="brandId"
                value={formData.brandId || ""}
                onChange={handleChange}
                placeholder="Select Brand"
                options={[
                  { value: "", label: "Select Brand" },
                  ...brands
                    .filter((brand) => brand.isActive !== false)
                    .map((brand) => ({ value: String(brand.id), label: brand.name })),
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Enter product description..."
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Original Price (for discount)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Product Media */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-3 sm:p-4 border-2 border-primary-200 shadow-lg">
          <h2 className="text-base font-bold text-primary-800 mb-3 flex items-center gap-2">
            <FiUpload className="text-lg" />
            Product Media
          </h2>

          <div className="space-y-3">
            {/* Main Image */}
            <div className="bg-white rounded-lg p-3 border border-primary-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Main Image
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload Main Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="main-image-upload"
                  />
                  <label
                    htmlFor="main-image-upload"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors bg-white">
                    <FiUpload className="text-base text-primary-600" />
                    <span className="text-xs font-medium text-gray-700">
                      {formData.image
                        ? "Change Main Image"
                        : "Choose Main Image"}
                    </span>
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2 flex items-start gap-3">
                    <img
                      src={formData.image}
                      alt="Main Preview"
                      className="w-24 h-24 object-cover rounded-lg border-2 border-primary-300 shadow-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="mt-1 px-3 py-1.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium">
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Gallery */}
            <div className="bg-white rounded-lg p-3 border border-primary-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Product Gallery
              </h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Upload Gallery Images (Multiple)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                    id="gallery-upload"
                  />
                  <label
                    htmlFor="gallery-upload"
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed border-primary-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors bg-white">
                    <FiUpload className="text-base text-primary-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Choose Gallery Images
                    </span>
                  </label>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-primary-300 shadow-md"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image">
                            <FiX className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.images.length} image(s) in gallery
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {isTurbanCategory ? 'Total Meters Available' : 'Stock Quantity'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stockQuantity" step="any" value={formData.stockQuantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stock Status
              </label>
              <AnimatedSelect
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                options={[
                  { value: 'in_stock', label: 'In Stock' },
                  { value: 'low_stock', label: 'Low Stock' },
                  { value: 'out_of_stock', label: 'Out of Stock' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Product Variants */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            Product Variants
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 border-b border-gray-100 pb-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Custom Variant Options
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Add product variations like dimensions, colors, sizes, or custom choices.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => addPredefinedAttribute("Dimension")}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    + Dimension
                  </button>
                  <button
                    type="button"
                    onClick={() => addPredefinedAttribute("Color")}
                    className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    + Color
                  </button>
                  <button
                    type="button"
                    onClick={() => addPredefinedAttribute("Size")}
                    className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    + Size
                  </button>
                  <button
                    type="button"
                    onClick={addAttributeRow}
                    className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    + Custom Attribute
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-3">
                {(formData.variants?.attributes || []).map((attribute, idx) => {
                  const isDimension = attribute.name === "Dimension";
                  const isColor = attribute.name === "Color";
                  const isSize = attribute.name === "Size";

                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        {isDimension || isColor || isSize ? (
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide bg-gray-100 px-2.5 py-1 rounded">
                            {attribute.name}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={attribute.name || ""}
                            onChange={(e) => updateAttributeName(idx, e.target.value)}
                            placeholder="Attribute Name (e.g. Material)"
                            className="text-xs font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-primary-500 focus:outline-none bg-transparent py-0.5 px-1 w-48"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttributeRow(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          title="Remove variant option"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Values Table with Inline Price & Stock */}
                      {(attribute.values || []).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 text-gray-500 font-semibold">
                                <th className="py-1 pb-2">Option Value</th>
                                <th className="py-1 pb-2 w-28">
                                  Price {isColor && isTurbanCategory && <span className="text-red-500">*</span>}
                                </th>
                                <th className="py-1 pb-2 w-28">Stock</th>
                                {isColor && isTurbanCategory && <th className="py-1 pb-2 w-16 text-center">Photo</th>}
                                <th className="py-1 pb-2 w-10 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(attribute.values || []).map((val) => {
                                const comboKey = getCombinationKeyForSingleValue(attribute.name, val);
                                const colorHex = isColor ? (formData.variants?.colorHexMap?.[val] || "") : "";
                                const hasPhoto = isColor && isTurbanCategory && !!formData.variants?.imageMap?.[comboKey];
                                const hasPrice = !!formData.variants?.prices?.[comboKey];
                                return (
                                  <tr key={val} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-2 font-medium text-gray-700">
                                      <div className="flex items-center gap-2">
                                        {isColor && (
                                          <span
                                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 inline-block"
                                            style={{ backgroundColor: colorHex || val }}
                                            title={colorHex || val}
                                          />
                                        )}
                                        {val}
                                      </div>
                                    </td>
                                    <td className="py-2 pr-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.variants?.prices?.[comboKey] ?? ""}
                                        onChange={(e) => {
                                          const nextVal = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            variants: {
                                              ...prev.variants,
                                              prices: {
                                                ...(prev.variants?.prices || {}),
                                                [comboKey]: nextVal === "" ? "" : Number(nextVal),
                                              },
                                            },
                                          }));
                                        }}
                                        className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white ${isColor && isTurbanCategory && !hasPrice ? 'border-red-300' : 'border-gray-300'
                                          }`}
                                        placeholder={isColor && isTurbanCategory ? "Required *" : "Use base price"}
                                      />
                                    </td>
                                    <td className="py-2 pr-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={formData.variants?.stockMap?.[comboKey] ?? ""}
                                        onChange={(e) => {
                                          const nextVal = e.target.value;
                                          setFormData((prev) => ({
                                            ...prev,
                                            variants: {
                                              ...prev.variants,
                                              stockMap: {
                                                ...(prev.variants?.stockMap || {}),
                                                [comboKey]: nextVal === "" ? "" : Number(nextVal),
                                              },
                                            },
                                          }));
                                        }}
                                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white"
                                        placeholder="Stock"
                                      />
                                    </td>
                                    {isColor && isTurbanCategory && (
                                      <td className="py-2 text-center">
                                        {hasPhoto ? (
                                          <img
                                            src={formData.variants.imageMap[comboKey]}
                                            alt={val}
                                            className="w-8 h-8 rounded object-cover border-2 border-green-400 mx-auto"
                                          />
                                        ) : (
                                          <span className="text-[10px] text-red-400 font-medium">No photo</span>
                                        )}
                                      </td>
                                    )}
                                    <td className="py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removeAttributeValue(idx, val)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                        title="Remove option"
                                      >
                                        <FiX className="w-3.5 h-3.5 mx-auto" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No option values added yet.</p>
                      )}

                      {/* Add Value Input Panel */}
                      {isDimension ? (
                        <DimensionInputPanel onAdd={(val, price, stock) => handleAddValueWithPriceStock(idx, val, price, stock)} />
                      ) : isColor ? (
                        <ColorInputPanel
                          isTurbanCategory={isTurbanCategory}
                          onAdd={(val, price, stock) => handleAddValueWithPriceStock(idx, val, price, stock)}
                          onTurbanColorAdd={handleTurbanColorAdd}
                        />
                      ) : isSize ? (
                        <SizeInputPanel onAdd={(val, price, stock) => handleAddValueWithPriceStock(idx, val, price, stock)} />
                      ) : (
                        <CustomAttributeInputPanel onAdd={(val, price, stock) => handleAddValueWithPriceStock(idx, val, price, stock)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {variantCombinations.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Variant Prices
                </p>
                <div className="space-y-2">
                  {variantCombinations.map((combo) => (
                    <div key={combo.key} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <p className="text-xs text-gray-700 md:col-span-1">
                        {combo.label || ((combo.size || "Any Size") + " / " + (combo.color || "Any Color"))}
                      </p>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.variants?.prices?.[combo.key] ?? ""}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            variants: {
                              ...prev.variants,
                              prices: {
                                ...(prev.variants?.prices || {}),
                                [combo.key]: nextValue === "" ? "" : Number(nextValue),
                              },
                            },
                          }));
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                        placeholder="Use base price"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.variants?.stockMap?.[combo.key] ?? ""}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            variants: {
                              ...prev.variants,
                              stockMap: {
                                ...(prev.variants?.stockMap || {}),
                                [combo.key]: nextValue === "" ? "" : Number(nextValue),
                              },
                            },
                          }));
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                        placeholder="Variant stock"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id={`variant-image-${combo.key}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVariantImageUpload(combo.key, file);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`variant-image-${combo.key}`}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs cursor-pointer hover:bg-gray-100"
                        >
                          Upload
                        </label>
                        {formData.variants?.imageMap?.[combo.key] && (
                          <img
                            src={formData.variants.imageMap[combo.key]}
                            alt="Variant"
                            className="w-8 h-8 rounded object-cover border border-gray-300"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select
                    value={formData.variants?.defaultVariant?.size || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        variants: {
                          ...prev.variants,
                          defaultVariant: {
                            ...(prev.variants?.defaultVariant || {}),
                            size: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                  >
                    <option value="">Default size (optional)</option>
                    {(formData.variants?.sizes || []).map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <select
                    value={formData.variants?.defaultVariant?.color || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        variants: {
                          ...prev.variants,
                          defaultVariant: {
                            ...(prev.variants?.defaultVariant || {}),
                            color: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs"
                  >
                    <option value="">Default color (optional)</option>
                    {(formData.variants?.colors || []).map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Turban-Specific: Fabric Type & Advanced Config */}
        {isTurbanCategory && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-800">Turban Configuration</h2>
            <TurbanFabricSection
              fabrics={formData.turbanConfig?.fabric || []}
              onChange={(fabric) => setFormData((prev) => ({ ...prev, turbanConfig: { ...prev.turbanConfig, fabric } }))}
            />
            <TurbanAdvancedConfig
              config={formData.turbanConfig || {}}
              onChange={(turbanConfig) => setFormData((prev) => ({ ...prev, turbanConfig }))}
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">Tags</h2>
          <div>
            <input
              type="text"
              value={(formData.tags || []).join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t);
                setFormData({ ...formData, tags });
              }}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </div>

        {/* Options */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            Product Options
          </h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="flashSale"
                checked={formData.flashSale}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-700">
                Flash Sale
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isNewArrival"
                checked={formData.isNewArrival}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-700">
                New Arrival
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-700">
                Featured Product
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-700">
                Visible to Customers
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/vendor/products/manage-products")}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploadingMedia}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 gradient-green text-white rounded-lg hover:shadow-glow-green transition-all font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            <FiSave />
            {isUploadingMedia ? "Uploading Media..." : isSaving ? "Creating..." : "Create Product"}
          </button>
        </div>

        {/* Product FAQs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-800">Product FAQs</h2>
            <button
              type="button"
              onClick={addFaq}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add FAQ
            </button>
          </div>
          <div className="space-y-3">
            {(formData.faqs || []).map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600">FAQ #{index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={faq.question || ""}
                  onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                  placeholder="Question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                />
                <textarea
                  value={faq.answer || ""}
                  onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                  rows={2}
                  placeholder="Answer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                />
              </div>
            ))}
            {(formData.faqs || []).length === 0 && (
              <p className="text-xs text-gray-500">No FAQs added yet.</p>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default AddProduct;

