import express from "express";
import mongoose from "mongoose";
import liveOrdersRouter from "./routes/liveOrders.js";
import archiveOrdersRouter from "./routes/archiveOrders.js";
import productRouter from './routes/products.js';
import uploadRouter from './routes/upload.js'
import authRouther from './routes/auth.js'
import klantenRouter from './routes/klanten.js'
import toestelRouter from './routes/toestellen.js'
import boekingRouter from './routes/boeking.js'
import cors from 'cors';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
// Routes mounten
app.use("/live-orders", liveOrdersRouter);
app.use("/archive-orders", archiveOrdersRouter);
app.use("/products" , productRouter);
app.use("/uploads" , uploadRouter)
app.use("/auth", authRouther);
app.use("/klant" , klantenRouter);
app.use("/toestellen" , toestelRouter)
app.use("/boekingen", boekingRouter);
app.use("/assets", express.static(path.join(__dirname, "assets")));const PORT = process.env.PORT || 3000;
app.listen(PORT);