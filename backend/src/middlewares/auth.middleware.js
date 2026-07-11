import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-local-secret";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.session = req.session || {};
      req.session.userId = decoded.userId;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  }

  if (req.session?.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
};

export default authMiddleware;