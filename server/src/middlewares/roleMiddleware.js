module.exports = function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(403).json({
          message: "Akses ditolak: Role tidak ditemukan dalam token.",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        console.log(allowedRoles);
        return res.status(403).json({
          message: `Akses ditolak: Role '${userRole}' tidak memiliki izin untuk mengakses resource ini.`,
        });
      }

      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);
      res
        .status(500)
        .json({ message: "Terjadi kesalahan di middleware role." });
    }
  };
};
