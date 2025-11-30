const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log("No token found in Authorization header or HttpOnly cookie.");
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);

        if (
          err.name === "TokenExpiredError" ||
          err.name === "JsonWebTokenError"
        ) {
          res.clearCookie("token");
        }
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = verifyToken;
