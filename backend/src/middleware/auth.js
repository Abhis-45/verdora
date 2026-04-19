import jwt from "jsonwebtoken";

const getBearerToken = (req) => req.headers.authorization?.split(" ")[1] || "";

const attachDecodedUser = (req, decoded) => {
  req.user = decoded;
  req.userId = decoded.id;
  req.userRole = decoded.role;

  if (decoded.role === "admin") {
    req.adminId = decoded.id;
  }

  if (decoded.role === "vendor") {
    req.vendorId = decoded.id;
    req.vendorRole = decoded.role;
    req.vendorName = decoded.vendorName || decoded.username;
  }

  req.userName = decoded.vendorName || decoded.username || decoded.email;
};

const verifyJwt = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const authMiddleware = (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyJwt(token);
    attachDecodedUser(req, decoded);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const optionalAuthMiddleware = (req, _res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const decoded = verifyJwt(token);
    attachDecodedUser(req, decoded);
  } catch {
    req.userId = null;
  }

  return next();
};

export const createRoleMiddleware =
  (
    allowedRoles,
    {
      missingMessage = "Token required",
      invalidMessage = "Invalid token",
      forbiddenMessage = "Forbidden",
    } = {},
  ) =>
  (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: missingMessage });
    }

    try {
      const decoded = verifyJwt(token);
      if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0 &&
        !allowedRoles.includes(decoded.role)
      ) {
        return res.status(403).json({ message: forbiddenMessage });
      }

      attachDecodedUser(req, decoded);
      return next();
    } catch {
      return res.status(401).json({ message: invalidMessage });
    }
  };

export const adminAuthMiddleware = createRoleMiddleware(["admin"], {
  missingMessage: "Admin token required",
  forbiddenMessage: "Admin access required",
});

export const vendorAuthMiddleware = createRoleMiddleware(["vendor"], {
  missingMessage: "Vendor token required",
  forbiddenMessage: "Vendor access required",
});
