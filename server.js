import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";



import uploadRouter from "./modules/helper/upload.js";
import authenticationRoutes from "./modules/authentication/authentication.routes.js";
import rentingRoutes from "./modules/renting/renting.routes.js";
import purchaseRoutes from "./modules/purchase/purchase.routes.js"
import logistiekRoutes from "./modules/logistiek/logistiek.routes.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

mongoose.connect(process.env.MONGO_URI);
// Routes mounten

app.use("/uploads", uploadRouter);
app.use("/authentication" , authenticationRoutes)
app.use("/purchase" , purchaseRoutes)
app.use("/renting", rentingRoutes);
app.use("/logistics" , logistiekRoutes);





const PORT = process.env.PORT || 3000;
app.listen(PORT);
