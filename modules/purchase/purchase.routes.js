import express from "express";

import liveOrdersRouter from "./orders/liveOrders.router.js";
import archiveOrdersRouter from "./orders/archiveOrders.router.js";
import productRouter from "./products/product.router.js";

const router = express.Router();



router.use("/live-orders", liveOrdersRouter);
router.use("/archive-orders", archiveOrdersRouter);
router.use("/products", productRouter);

export default router;
