// routes/auth.js
import express from "express";
import auth from "../../../middelware/auth.js";
import * as authService from "./authentication.service.js";
import * as userService from "../users/user.service.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.loginUser(email, password);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
});

router.get("/users", auth("admin"), async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create-user", auth("admin"), async (req, res) => {
  try {
    const { email, role } = req.body;
    const result = await authService.createUser(email, role);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/set-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const result = await authService.setPassword(token, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;