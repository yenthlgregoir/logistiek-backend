import express from "express";

import WerfRouter from "./werf/werf.router.js";
import ProjectLeiderRouter from "./projectleider/projectleider.router.js";
import Hoogtewerker from "./hoogtewerker/hoogtewerker.router.js"
import VerhuurRouter from "./verhuur/verhuur.router.js"
import WerfcontainerRouter from "./werfcontainers/werfcontainer.router.js"

const router = express.Router();


router.use("/werf", WerfRouter);
router.use("/projectleider" , ProjectLeiderRouter);
router.use("/hoogtewerker" , Hoogtewerker);
router.use("/verhuur" , VerhuurRouter);
router.use("/werfcontainer" , WerfcontainerRouter);

export default router;
