import express from "express";
import multer from "multer";
import csvController from "../controllers/csv.controller.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Routes
// router.post("/process-csv", upload.single("file"), csvController.uploadAndParse);
router.post("/simple-parse", upload.single("file"), csvController.simpleParse);

export default router;