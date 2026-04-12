import { Request, Response } from "express";
import { emitToAll } from "../socket.ts";
import {
    getAllCategoriesService,
    getServicesService,
    createCategoryService,
    createServiceItemService,
    updateCategoryService,
    deleteCategoryService,
    updateServiceItemService,
    deleteServiceItemService,
    createOrderService,
    getOrdersService,
    updateOrderStatusService,
    getOccupiedRoomsService
} from "../services/serviceBookingService.ts";

// ==========================
// 1. QUẢN LÝ DANH MỤC & DỊCH VỤ (ADMIN/STAFF)
// ==========================

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getAllCategoriesService();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await getServicesService(req.query.categoryId as string);
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const newCategory = await createCategoryService(req.body);
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const newService = await createServiceItemService(req.body);
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await updateCategoryService(req.params.id as string, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    const status = (error as Error).message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteCategoryService(req.params.id as string);
    res.json({ success: true, message: "Đã xóa danh mục và tất cả dịch vụ bên trong" });
  } catch (error) {
    const status = (error as Error).message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ success: false, message: (error as Error).message });
  }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await updateServiceItemService(req.params.id as string, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    const status = (error as Error).message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ success: false, message: (error as Error).message });
  }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteServiceItemService(req.params.id as string);
    res.json({ success: true, message: "Đã xóa dịch vụ" });
  } catch (error) {
    const status = (error as Error).message.includes("Không tìm thấy") ? 404 : 500;
    res.status(status).json({ success: false, message: (error as Error).message });
  }
};

// ==========================
// 2. QUẢN LÝ ĐƠN HÀNG DỊCH VỤ (CUSTOMER / STAFF)
// ==========================

export const createServiceOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await createOrderService(req.body);
    emitToAll("new_service_order", order);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    const status = (error as Error).message.includes("Thiếu") ? 400 : 500;
    res.status(status).json({ success: false, message: (error as Error).message });
  }
};

export const getServiceOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const orders = await getOrdersService(req.query.bookingId as string, req.query.status as string);
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

export const updateServiceOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, paymentStatus } = req.body;
        const updatedOrder = await updateOrderStatusService(req.params.id as string, status, paymentStatus);
        
        emitToAll("service_order_updated", updatedOrder);
        res.json({ success: true, message: "Cập nhật thành công", data: updatedOrder });
    } catch (error) {
        const statusCode = (error as Error).message.includes("Không tìm thấy") ? 404 : 500;
        res.status(statusCode).json({ success: false, message: (error as Error).message });
    }
};

export const getOccupiedRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const filteredResults = await getOccupiedRoomsService();
        res.json({ success: true, data: filteredResults });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

