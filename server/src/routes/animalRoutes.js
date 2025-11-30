const express = require("express");
const router = express.Router();
const {
  registerAnimal,
  getAllAnimals,
  getAnimalById,
  updateAnimalInfo,
  getAnimalHistory,
} = require("../controllers/AnimalController");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.post("/", roleMiddleware("Farmer"), registerAnimal);

router.get("/", getAllAnimals);

router.get("/:animalID", getAnimalById);

router.put("/:animalID", roleMiddleware("Farmer", "Admin"), updateAnimalInfo);

router.get("/:animalID/history", getAnimalHistory);

module.exports = router;
