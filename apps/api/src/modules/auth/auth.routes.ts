
import { Router } from "express";
import { adminLogin } from "./auth.controller.js";

const router = Router();

router.post("/login", adminLogin);

export default router;
