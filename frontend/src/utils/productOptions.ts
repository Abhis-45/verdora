export type PlantSizeOption = {
  id: string;
  label: string;
  price: number;
  mrp: number;
  isDefault?: boolean;
};

export const FREE_SIZE_LABEL = "FREE SIZE";
export const DEFAULT_PLANT_SIZE_ID = "free-size-default";
export const PLANT_SIZE_PRESETS = [FREE_SIZE_LABEL, "XS", "S", "M", "L", "XL", "XXL"];
export const PRODUCT_CATEGORY_OPTIONS = [
  "Indoor Plants",
  "Outdoor Plants",
  "Flowering Plants",
  "Succulents",
  "Herbs",
  "Seeds",
  "Pots & Planters",
  "Tools & Accessories",
  "Accessories",
  "Seasonal Plants",
];
export const CUSTOM_CATEGORY_OPTION = "__custom__";

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const normalizePlantSizes = (
  sizes: PlantSizeOption[] | undefined | null,
  fallbackPrice = 0,
  fallbackMrp = 0,
) => {
  const cleaned = (Array.isArray(sizes) ? sizes : [])
    .map((size, index) => {
      const label = (size?.label || "").trim().toUpperCase();
      if (!label) {
        return null;
      }

      const price = normalizeNumber(size.price || fallbackPrice);
      const mrp = Math.max(normalizeNumber(size.mrp || fallbackMrp), price);

      return {
        id: size.id || `${label.toLowerCase()}-${index + 1}`,
        label,
        price,
        mrp,
        isDefault: Boolean(size.isDefault),
      };
    })
    .filter(Boolean) as PlantSizeOption[];

  if (cleaned.length === 0) {
    return [
      {
        id: DEFAULT_PLANT_SIZE_ID,
        label: FREE_SIZE_LABEL,
        price: normalizeNumber(fallbackPrice),
        mrp: Math.max(normalizeNumber(fallbackMrp), normalizeNumber(fallbackPrice)),
        isDefault: true,
      },
    ];
  }

  if (!cleaned.some((size) => size.isDefault)) {
    cleaned[0].isDefault = true;
  }

  return cleaned.map((size, index) => ({
    ...size,
    isDefault: index === cleaned.findIndex((option) => option.isDefault),
  }));
};

export const getDefaultPlantSize = (
  sizes: PlantSizeOption[] | undefined | null,
  fallbackPrice = 0,
  fallbackMrp = 0,
) => normalizePlantSizes(sizes, fallbackPrice, fallbackMrp)[0];

export const buildCartKey = (
  productId: string | number,
  sizeId?: string | null,
  sizeLabel?: string | null,
) => {
  const sizeToken = sizeId || sizeLabel || "default";
  return `${productId}::${sizeToken}`;
};
