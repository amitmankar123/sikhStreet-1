const normalizeVariantPart = (value) => String(value || "").trim().toLowerCase();
const normalizeAxisName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const getVariantSignature = (variant = {}) =>
  Object.entries(variant || {})
    .map(([axis, value]) => [normalizeAxisName(axis), normalizeVariantPart(value)])
    .filter(([axis, value]) => axis && value)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([axis, value]) => `${axis}=${value}`)
    .join("|");

export const formatVariantLabel = (variant = {}) => {
  const entries = Object.entries(variant || {})
    .map(([axis, value]) => [String(axis || "").trim(), String(value || "").trim()])
    .filter(([axis, value]) => axis && value);
  if (!entries.length) return "";
  return entries
    .map(([axis, value]) => {
      const axisLabel = axis
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return `${axisLabel.charAt(0).toUpperCase()}${axisLabel.slice(1)}: ${value}`;
    })
    .join(" | ");
};

export const ADDITIVE_ATTRIBUTES = ["color", "frame"];

export const resolveVariantPrice = (product, selectedVariant) => {
  if (!product) return 0;
  let basePrice = Number(product.price) || 0;

  const entries =
    product?.variants?.prices instanceof Map
      ? Array.from(product.variants.prices.entries())
      : Object.entries(product?.variants?.prices || {});

  const validPrices = entries.map(([, v]) => Number(v)).filter((p) => Number.isFinite(p) && p > 0);
  const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  if (basePrice === 0 && minVariantPrice > 0) {
    basePrice = minVariantPrice;
  }

  if (!selectedVariant || !entries.length) return basePrice;

  // Ultra-robust key normalization: converts '×' -> 'x' and all spaces/hyphens/underscores to '_'
  const cleanKey = (str) =>
    String(str || "")
      .trim()
      .toLowerCase()
      .replace(/×/g, "x")
      .replace(/[_\s-]+/g, "_");

  // 1. Check exact combined signature
  const dynamicKey = getVariantSignature(selectedVariant || {});
  if (dynamicKey) {
    const cleanedDynamicKey = cleanKey(dynamicKey);
    const direct = entries.find(([key]) => cleanKey(key) === cleanedDynamicKey);
    if (direct && Number.isFinite(Number(direct[1])) && Number(direct[1]) > 0) {
      return Number(direct[1]);
    }
  }

  // 2. Check partial/subset match (e.g. matching size + material, or size + frame)
  const selEntries = Object.entries(selectedVariant || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${cleanKey(k)}=${cleanKey(v)}`);

  if (selEntries.length > 0) {
    const partialMatch = entries.find(([key, val]) => {
      const cKey = cleanKey(key);
      const numVal = Number(val);
      if (!Number.isFinite(numVal) || numVal <= 0) return false;
      return selEntries.every(se => cKey.includes(se));
    });
    if (partialMatch) return Number(partialMatch[1]);
  }

  // 3. Fallback to size/dimension match
  const sizeVal = selectedVariant.size || selectedVariant.dimension || selectedVariant.Dimension || selectedVariant.Length;
  if (sizeVal) {
    const cleanSize = cleanKey(sizeVal);
    const sizeMatch = entries.find(([key, val]) => {
      const cKey = cleanKey(key);
      const numVal = Number(val);
      return cKey.includes(cleanSize) && Number.isFinite(numVal) && numVal > 0;
    });
    if (sizeMatch) return Number(sizeMatch[1]);
  }

  // 4. Legacy combined signatures (size|color, size-color, etc)
  const size = String(selectedVariant.size || "").trim().toLowerCase();
  const color = String(selectedVariant.color || "").trim().toLowerCase();

  if (size && color) {
    const candidates = [
      `${size}|${color}`,
      `${size}-${color}`,
      `${size}_${color}`,
      `${size}:${color}`,
    ];
    for (const candidate of candidates) {
      const match = entries.find(([key]) => String(key).trim().toLowerCase() === candidate);
      if (match && Number.isFinite(Number(match[1])) && Number(match[1]) > 0) return Number(match[1]);
    }
  }

  // 5. Fallback to single axes: replacement (size) vs additive (color, frame)
  let calculatedPrice = basePrice;
  let additiveSum = 0;

  const singleKeys = Object.entries(selectedVariant || {})
    .map(([axis, val]) => ({
      axis: cleanKey(axis),
      keyStr: `${cleanKey(axis)}=${cleanKey(val)}`,
      valStr: cleanKey(val)
    }));

  for (const { axis, keyStr, valStr } of singleKeys) {
    if (ADDITIVE_ATTRIBUTES.includes(axis)) continue;

    const match = entries.find(([key]) => {
      const k = cleanKey(key);
      return k === keyStr || k === valStr;
    });

    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        calculatedPrice = parsed;
        break;
      }
    }
  }

  for (const { axis, keyStr, valStr } of singleKeys) {
    if (!ADDITIVE_ATTRIBUTES.includes(axis)) continue;

    const match = entries.find(([key]) => {
      const k = cleanKey(key);
      return k === keyStr || k === valStr;
    });

    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        additiveSum += parsed;
      }
    }
  }

  const resultPrice = calculatedPrice + additiveSum;
  return resultPrice > 0 ? resultPrice : basePrice;
};
