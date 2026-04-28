export type PotOption = {
  name: string;
  price: number;
  mrp: number;
  image?: string;
};

export type PlantSizeOption = {
  id: string;
  label: string;
  price: number;
  mrp: number;
  isDefault?: boolean;
  potPrice?: number;
  potMrp?: number;
  potName?: string;
  potImage?: string;
  includePotByDefault?: boolean;
  potOptions?: PotOption[]; // New: Multiple pot options
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

const normalizePotOptions = (options: PotOption[] | undefined) =>
  (Array.isArray(options) ? options : [])
    .map((pot, index) => {
      const name = String(pot?.name || "").trim();
      const image = String(pot?.image || "").trim();
      const price = normalizeNumber(pot?.price || 0);
      const mrp = Math.max(normalizeNumber(pot?.mrp || 0), price);

      if (!name && !image && price === 0 && mrp === 0) {
        return null;
      }

      return {
        name: name || `Pot Option ${index + 1}`,
        price,
        mrp,
        image,
      };
    })
    .filter(Boolean) as PotOption[];

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
      const potPrice = normalizeNumber(size.potPrice || 0);
      const potMrp = Math.max(normalizeNumber(size.potMrp || 0), potPrice);

      return {
        id: size.id || `${label.toLowerCase()}-${index + 1}`,
        label,
        price,
        mrp,
        potPrice,
        potMrp,
        potName: size.potName || "",
        potImage: size.potImage || "",
        includePotByDefault: Boolean(size.includePotByDefault),
        potOptions: normalizePotOptions(size.potOptions),
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
        potPrice: 0,
        potMrp: 0,
        potName: "",
        potImage: "",
        includePotByDefault: false,
        potOptions: [],
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
