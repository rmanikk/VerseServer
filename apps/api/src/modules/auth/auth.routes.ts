
import { Router } from "express";

import {
  adminLogin,
  getAdminProfile,
} from "./auth.controller.js";

import { requireAdmin } from "../../middleware/admin-auth.middleware.js";

const router = Router();

router.post("/login", adminLogin);
router.get("/me", requireAdmin, getAdminProfile);

export default router;
