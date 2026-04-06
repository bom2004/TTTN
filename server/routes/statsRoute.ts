import express from "express";
import { getAdminStats } from "../controllers/statsController.ts";

const statsRouter = express.Router();

// Lấy dữ liệu thống kê cho Admin
statsRouter.get("/admin-stats", getAdminStats);

export default statsRouter;
