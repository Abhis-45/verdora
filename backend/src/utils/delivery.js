export const DEFAULT_ORIGIN_ADDRESS = {
  address: "",
  pincode: "411001",
  city: "Pune",
  state: "Maharashtra",
  country: "India",
};

export const normalizePincode = (value = "") =>
  String(value).replace(/\D/g, "").slice(0, 6);

export const isValidPincode = (value = "") =>
  /^\d{6}$/.test(normalizePincode(value));

export const normalizeAddress = (address = {}) => ({
  address: address.address?.trim?.() || "",
  pincode: normalizePincode(address.pincode || DEFAULT_ORIGIN_ADDRESS.pincode),
  city: address.city?.trim?.() || DEFAULT_ORIGIN_ADDRESS.city,
  state: address.state?.trim?.() || DEFAULT_ORIGIN_ADDRESS.state,
  country: address.country?.trim?.() || DEFAULT_ORIGIN_ADDRESS.country,
});

const getTransitDays = (originPincode, destinationPincode) => {
  if (!isValidPincode(originPincode) || !isValidPincode(destinationPincode)) {
    return 4;
  }

  if (originPincode === destinationPincode) {
    return 1;
  }

  if (originPincode.slice(0, 3) === destinationPincode.slice(0, 3)) {
    return 2;
  }

  if (originPincode.slice(0, 2) === destinationPincode.slice(0, 2)) {
    return 3;
  }

  if (originPincode[0] === destinationPincode[0]) {
    return 4;
  }

  return 5;
};

export const calculateDeliveryEstimate = ({
  origin,
  destination,
  fromDate = new Date(),
}) => {
  const normalizedOrigin = normalizeAddress(origin);
  const normalizedDestination = normalizeAddress(destination);
  const transitDays = getTransitDays(
    normalizedOrigin.pincode,
    normalizedDestination.pincode,
  );

  const estimatedDate = new Date(fromDate);
  estimatedDate.setHours(12, 0, 0, 0);
  estimatedDate.setDate(estimatedDate.getDate() + transitDays);

  return {
    origin: normalizedOrigin,
    destination: normalizedDestination,
    estimatedDeliveryDate: estimatedDate,
    transitDays,
    message: `Delivery in ${transitDays} day${transitDays === 1 ? "" : "s"}`,
    calculatedAt: new Date(),
  };
};

export const normalizePlantSizes = (plantSizes = [], fallbackPrice = 0, fallbackMrp = 0) => {
  const cleaned = (Array.isArray(plantSizes) ? plantSizes : [])
    .map((size, index) => {
      const label = String(size?.label || "")
        .trim()
        .toUpperCase();

      if (!label) {
        return null;
      }

      const price = Math.max(Number(size.price || fallbackPrice || 0), 0);
      const mrp = Math.max(Number(size.mrp || fallbackMrp || price || 0), price);
      const potPrice = Math.max(Number(size.potPrice || 0), 0);
      const potMrp = Math.max(Number(size.potMrp || 0), potPrice);

      return {
        id: size.id || `${label.toLowerCase()}-${index + 1}`,
        label,
        price,
        mrp,
        potPrice,
        potMrp,
        isDefault: Boolean(size.isDefault),
        includePotByDefault: Boolean(size.includePotByDefault),
      };
    })
    .filter(Boolean);

  if (cleaned.length === 0) {
    return [
      {
        id: "free-size-default",
        label: "FREE SIZE",
        price: Math.max(Number(fallbackPrice || 0), 0),
        mrp: Math.max(Number(fallbackMrp || fallbackPrice || 0), Number(fallbackPrice || 0)),
        potPrice: 0,
        potMrp: 0,
        isDefault: true,
        includePotByDefault: false,
      },
    ];
  }

  if (!cleaned.some((size) => size.isDefault)) {
    cleaned[0].isDefault = true;
  }

  const defaultIndex = cleaned.findIndex((size) => size.isDefault);
  return cleaned.map((size, index) => ({
    ...size,
    isDefault: index === defaultIndex,
  }));
};

export const getDefaultPlantSize = (plantSizes = [], fallbackPrice = 0, fallbackMrp = 0) =>
  normalizePlantSizes(plantSizes, fallbackPrice, fallbackMrp)[0];
