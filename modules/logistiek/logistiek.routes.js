import express from "express";

import WerfRouter from "./werf/werf.router.js";
import ProjectLeiderRouter from "./projectleider/projectleider.router.js";
import SchaarliftRouter from "./schaarliften/schaarlift.router.js"

const router = express.Router();


router.use("/werf", WerfRouter);
router.use("/projectleider" , ProjectLeiderRouter);
router.use("/schaarlift" , SchaarliftRouter);

export default router;
