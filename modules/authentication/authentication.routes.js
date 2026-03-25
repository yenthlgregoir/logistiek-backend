import express from "express";

import authRouther from "./authentication/authentication.router.js";


const router = express.Router();


router.use("/auth", authRouther);

export default router;



