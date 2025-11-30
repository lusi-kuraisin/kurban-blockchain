const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./src/routes/router");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");

dotenv.config();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Client-Type"],
  })
);
app.use(cookieParser());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("🐄 Welcome to the Kurban Blockchain API!");
});

app.use("/api/v1", router);

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.error("🔥 Global Error:", err.stack);
  }
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http: ${PORT}`);
});
