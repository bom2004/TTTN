import express from "express";
import {
  getAllCategories,
  getServices,
  createCategory,
  createService,
  updateCategory,
  deleteCategory,
  updateService,
  deleteService,
  createServiceOrder,
  getServiceOrders,
  updateServiceOrderStatus,
  getOccupiedRooms,
} from "../controllers/serviceBookingController.ts";

const serviceBookingRouter = express.Router();

// Danh mục dịch vụ
serviceBookingRouter.get("/categories", getAllCategories);
serviceBookingRouter.post("/categories", createCategory);
serviceBookingRouter.put("/categories/:id", updateCategory);
serviceBookingRouter.delete("/categories/:id", deleteCategory);

// Dịch vụ (món ăn, đồ uống, vật dụng...)
serviceBookingRouter.get("/services", getServices);
serviceBookingRouter.post("/services", createService);
serviceBookingRouter.put("/services/:id", updateService);
serviceBookingRouter.delete("/services/:id", deleteService);

// Đơn đặt hàng dịch vụ
serviceBookingRouter.post("/orders", createServiceOrder);
serviceBookingRouter.get("/orders", getServiceOrders);
serviceBookingRouter.put("/orders/:id/status", updateServiceOrderStatus);
serviceBookingRouter.get("/occupied-rooms", getOccupiedRooms);

export default serviceBookingRouter;
