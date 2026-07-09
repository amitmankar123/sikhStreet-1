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
  const basePrice = Number(product?.price) || 0;
  if (!selectedVariant || !product?.variants?.prices) return basePrice;

  const entries =
    product.variants.prices instanceof Map
      ? Array.from(product.variants.prices.entries())
      : Object.entries(product.variants.prices || {});

  // 1. Check exact combined signature
  const dynamicKey = getVariantSignature(selectedVariant || {});
  if (dynamicKey) {
    const direct = entries.find(([key]) => String(key).trim() === dynamicKey);
    if (direct && Number.isFinite(Number(direct[1])) && Number(direct[1]) >= 0) return Number(direct[1]);

    const normalized = entries.find(([key]) => String(key).trim().toLowerCase() === dynamicKey.toLowerCase());
    if (normalized && Number.isFinite(Number(normalized[1])) && Number(normalized[1]) >= 0) return Number(normalized[1]);
  }

  // 2. Check legacy combined signatures (size|color, size-color, etc)
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
      if (match && Number.isFinite(Number(match[1])) && Number(match[1]) >= 0) return Number(match[1]);
    }
  }

  // 3. Fallback to single axes: some are replacement (like size), some are additive (like color, frame)
  let calculatedPrice = basePrice;
  let hasReplacedBasePrice = false;
  let additiveSum = 0;

  const singleKeys = Object.entries(selectedVariant || {})
    .map(([axis, val]) => ({
      axis: axis.toLowerCase().trim().replace(/\s+/g, "_"),
      keyStr: `${axis.toLowerCase().trim().replace(/\s+/g, "_")}=${String(val).toLowerCase().trim()}`,
      valStr: String(val).toLowerCase().trim()
    }));

  // Process Replacement keys first (e.g., size)
  for (const { axis, keyStr, valStr } of singleKeys) {
    if (ADDITIVE_ATTRIBUTES.includes(axis)) continue;

    const match = entries.find(([key]) => {
      const k = String(key).trim().toLowerCase();
      return k === keyStr || k === valStr;
    });

    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed >= 0) {
        calculatedPrice = parsed;
        hasReplacedBasePrice = true;
        break; // Use the first found replacement price
      }
    }
  }

  // Process Additive keys (e.g., color, frame)
  for (const { axis, keyStr, valStr } of singleKeys) {
    if (!ADDITIVE_ATTRIBUTES.includes(axis)) continue;

    const match = entries.find(([key]) => {
      const k = String(key).trim().toLowerCase();
      return k === keyStr || k === valStr;
    });

    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed >= 0) {
        additiveSum += parsed;
      }
    }
  }

  return calculatedPrice + additiveSum;
};
