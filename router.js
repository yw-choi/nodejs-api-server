import express from "express";
import auth from "./controllers/auth.js";
import image from "./controllers/image.js";

const router = express.Router();

router.use("/auth", auth);
router.use("/image", image);

export default router;
