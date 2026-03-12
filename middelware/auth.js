import jwt from "jsonwebtoken";

const auth = (...roles) => {
  return (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "Geen token" });
    }

    // 🔥 verwijder "Bearer "
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Geen toegang" });
      }

      next();
    } catch (_err) {
      return res.status(401).json({ message: "Ongeldige token" });
    }
  };
};
export default auth;
