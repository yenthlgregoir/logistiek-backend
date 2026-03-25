import express from "express";

import boekingRouter from "./boekingen/boeking.router.js";
import klantenRouter from "./klanten/klant.router.js";
import toestelRouter from "./toestellen/toestel.router.js";

const router = express.Router();


router.use("/klant", klantenRouter);
router.use("/toestellen", toestelRouter);
router.use("/boekingen", boekingRouter);

export default router;
