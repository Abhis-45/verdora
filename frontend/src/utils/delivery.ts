export type DeliveryLocation = {
  pincode: string;
  city: string;
  state: string;
  country: string;
  address?: string;
  label?: string;
};

export type DeliveryEstimate = {
  origin: DeliveryLocation;
  destination: DeliveryLocation;
  estimatedDeliveryDate: string;
  transitDays: number;
  message: string;
  calculatedAt: string;
};

export const DEFAULT_DELIVERY_LOCATION: DeliveryLocation = {
  pincode: "",
  city: "",
  state: "",
  country: "India",
  address: "",
};

export const normalizePincode = (value: string) =>
  value.replace(/\D/g, "").slice(0, 6);

export const isValidPincode = (value: string) =>
  /^\d{6}$/.test(normalizePincode(value));

export const resolveDeliveryLocation = (
  location?: Partial<DeliveryLocation> | null,
): DeliveryLocation => {
  const normalizedPincode = normalizePincode(
    location?.pincode || DEFAULT_DELIVERY_LOCATION.pincode,
  );
  const isDefaultPincode =
    normalizedPincode === DEFAULT_DELIVERY_LOCATION.pincode ||
    !normalizedPincode;
  const fallbackAddress = isDefaultPincode
    ? DEFAULT_DELIVERY_LOCATION.address || ""
    : "";
  const fallbackCity = isDefaultPincode
    ? DEFAULT_DELIVERY_LOCATION.city
    : "Selected area";
  const fallbackState = isDefaultPincode
    ? DEFAULT_DELIVERY_LOCATION.state
    : "India";

  return {
    address: location?.address?.trim() || fallbackAddress || "",
    label: location?.label?.trim() || "",
    pincode: normalizedPincode,
    city: location?.city?.trim() || fallbackCity,
    state: location?.state?.trim() || fallbackState,
    country: location?.country?.trim() || DEFAULT_DELIVERY_LOCATION.country,
  };
};

export const normalizeLocation = (
  location?: Partial<DeliveryLocation> | null,
): DeliveryLocation => resolveDeliveryLocation(location);

const getTransitDays = (originPincode: string, destinationPincode: string) => {
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
}: {
  origin?: Partial<DeliveryLocation> | null;
  destination?: Partial<DeliveryLocation> | null;
  fromDate?: Date;
}): DeliveryEstimate => {
  const normalizedOrigin = normalizeLocation(origin);
  const normalizedDestination = normalizeLocation(destination);
  const transitDays = getTransitDays(
    normalizedOrigin.pincode,
    normalizedDestination.pincode,
  );

  const estimated = new Date(fromDate);
  estimated.setHours(12, 0, 0, 0);
  estimated.setDate(estimated.getDate() + transitDays);

  return {
    origin: normalizedOrigin,
    destination: normalizedDestination,
    transitDays,
    estimatedDeliveryDate: estimated.toISOString(),
    calculatedAt: new Date().toISOString(),
    message: `Delivery by ${formatDeliveryDate(estimated.toISOString())}`,
  };
};

export const formatDeliveryDate = (value?: string | Date | null) => {
  if (!value) return "TBD";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getDeliveryLocationLabel = (
  location?: Partial<DeliveryLocation>,
) => {
  const normalized = normalizeLocation(location);
  return `${normalized.city}, ${normalized.state}`;
};

export const getDeliveryLocationSummary = (
  location?: Partial<DeliveryLocation>,
) => {
  const normalized = normalizeLocation(location);
  return `${normalized.pincode} - ${normalized.city}, ${normalized.state}`;
};
