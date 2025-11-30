require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "kurban_user",
    password: process.env.DB_PASS || "kurban_pw",
    database: process.env.DB_NAME || "kurban_db",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: process.env.DB_DIALECT || "postgres",
  },
  test: {
    username: "",
    password: "",
    database: "",
    host: "",
    dialect: "",
  },
  production: {
    username: "",
    password: "",
    database: "",
    host: "",
    dialect: "",
  },
};
