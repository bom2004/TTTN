import { Request, Response } from "express";
import mongoose from "mongoose";
import serviceCategoryModel from "../models/servicebooking/serviceCategoryModel.ts";
import serviceModel from "../models/servicebooking/serviceModel.ts";
import serviceOrderModel from "../models/servicebooking/serviceOrderModel.ts";
import bookingModel from "../models/bookingModel.ts";
import roomModel from "../models/roomModel.ts";
import bookingDetailModel from "../models/bookingDetailModel.ts";
import { emitToAll, emitToUser } from "../socket.ts";

// ==========================
// 1. QUẢN LÝ DANH MỤC & DỊCH VỤ (ADMIN/STAFF)
// ==========================

/** Lấy tất cả danh mục */
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await serviceCategoryModel.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/** Lấy tất cả dịch vụ (Có thể lọc theo category) */
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { categoryId } : {};
    const services = await serviceModel.find(filter).populate("categoryId").sort({ name: 1 });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/** Tạo danh mục mới */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    const newCategory = new serviceCategoryModel({ name, description });
    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/** Tạo dịch vụ mới */
export const createService = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, name, price, unit, image } = req.body;
    const newService = new serviceModel({ categoryId, name, price, unit, image });
    await newService.save();
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/** Cập nhật danh mục */
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await serviceCategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) { res.status(404).json({ success: false, message: "Không tìm thấy danh mục" }); return; }
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: (error as Error).message }); }
};

/** Xóa danh mục (kèm xóa tất cả dịch vụ bên trong) */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await serviceCategoryModel.findByIdAndDelete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, message: "Không tìm thấy danh mục" }); return; }
    await serviceModel.deleteMany({ categoryId: req.params.id });
    res.json({ success: true, message: "Đã xóa danh mục và tất cả dịch vụ bên trong" });
  } catch (error) { res.status(500).json({ success: false, message: (error as Error).message }); }
};

/** Cập nhật dịch vụ */
export const updateService = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await serviceModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) { res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" }); return; }
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: (error as Error).message }); }
};

/** Xóa dịch vụ */
export const deleteService = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await serviceModel.findByIdAndDelete(req.params.id);
    if (!deleted) { res.status(404).json({ success: false, message: "Không tìm thấy dịch vụ" }); return; }
    res.json({ success: true, message: "Đã xóa dịch vụ" });
  } catch (error) { res.status(500).json({ success: false, message: (error as Error).message }); }
};


// ==========================
// 2. QUẢN LÝ ĐƠN HÀNG DỊCH VỤ (CUSTOMER / STAFF)
// ==========================

/** 
 * Khách hàng đặt dịch vụ
 */
export const createServiceOrder = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId, roomId, items, note, paymentStatus } = req.body;

    if (!bookingId || !roomId || !items || items.length === 0) {
      res.status(400).json({ success: false, message: "Thiếu thông tin đặt hàng." });
      return;
    }

    // Tính tổng tiền từ mảng items
    let totalAmount = 0;
    const itemsWithPrice = await Promise.all(items.map(async (item: any) => {
        const serviceNode = await serviceModel.findById(item.serviceId).session(session);
        if (!serviceNode) throw new Error(`Dịch vụ ID ${item.serviceId} không tồn tại.`);
        
        const price = serviceNode.price;
        totalAmount += price * item.quantity;
        
        return {
            serviceId: item.serviceId,
            quantity: item.quantity,
            priceAtOrder: price
        };
    }));

    const newOrder = new serviceOrderModel({
      bookingId,
      roomId,
      items: itemsWithPrice,
      totalAmount,
      note,
      paymentStatus: paymentStatus || "unpaid",
      status: "pending"
    });

    await newOrder.save({ session });
    await session.commitTransaction();

    // Thông báo cho nhân viên qua Socket
    const populatedOrder = await serviceOrderModel.findById(newOrder._id)
        .populate('roomId', 'roomNumber')
        .populate('items.serviceId', 'name');

    emitToAll("new_service_order", populatedOrder);

    res.status(201).json({ success: true, data: populatedOrder });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: (error as Error).message });
  } finally {
    session.endSession();
  }
};

/** 
 * Lấy danh sách đơn dịch vụ (Admin/Staff xem toàn bộ hoặc lọc theo booking)
 */
export const getServiceOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { bookingId, status } = req.query;
        const filter: any = {};
        if (bookingId) filter.bookingId = bookingId;
        if (status) filter.status = status;

        const orders = await serviceOrderModel.find(filter)
            .populate('roomId', 'roomNumber')
            .populate('bookingId', 'customerInfo')
            .populate('items.serviceId', 'name image unit')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};

/** 
 * Cập nhật trạng thái đơn dịch vụ (Nhân viên thao tác)
 */
export const updateServiceOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { status, paymentStatus } = req.body;
        const { id } = req.params;

        const oldOrder = await serviceOrderModel.findById(id).session(session);
        if (!oldOrder) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
            return;
        }

        // Chỉ cập nhật những field được gửi lên (tránh ghi đè undefined)
        const updateFields: any = { status };
        if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;

        const updatedOrder = await serviceOrderModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, session, runValidators: false }
        ).populate('roomId', 'roomNumber').populate('items.serviceId', 'name');

        if (!updatedOrder) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Lỗi khi cập nhật đơn hàng." });
            return;
        }

        // Logic cộng dồn tiền vào Booking khi đơn hoàn thành và gộp vào phòng
        if (updatedOrder.paymentStatus === 'charged_to_room' && updatedOrder.bookingId) {
            if (status === 'completed' && oldOrder.status !== 'completed') {
                await bookingModel.findByIdAndUpdate(
                    updatedOrder.bookingId,
                    { $inc: { totalServiceAmount: updatedOrder.totalAmount } },
                    { session }
                );
            } else if (status === 'cancelled' && oldOrder.status === 'completed') {
                await bookingModel.findByIdAndUpdate(
                    updatedOrder.bookingId,
                    { $inc: { totalServiceAmount: -updatedOrder.totalAmount } },
                    { session }
                );
            }
        }

        await session.commitTransaction();
        session.endSession();

        emitToAll("service_order_updated", updatedOrder);
        res.json({ success: true, message: "Cập nhật thành công", data: updatedOrder });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};


/** 
 * Lấy danh sách các phòng đang có khách (occupied) kèm thông tin booking
 */
export const getOccupiedRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        // Lấy tất cả các phòng đang có trạng thái occupied
        const rooms = await roomModel.find({ status: "occupied" }).populate("roomTypeId");
        
        const results = await Promise.all(rooms.map(async (room) => {
            // Tìm booking detail đang active (checked_in) cho phòng này
            const activeDetail = await bookingDetailModel.findOne({
                roomId: room._id,
                roomStatus: "checked_in"
            }).populate({
                path: "bookingId",
                populate: { path: "roomTypeId" }
            });

            return {
                room,
                booking: activeDetail?.bookingId || null
            };
        }));

        // Lọc bỏ những phòng mà không tìm thấy booking (trường hợp data không nhất quán)
        const filteredResults = results.filter(item => item.booking !== null);

        res.json({ success: true, data: filteredResults });
    } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
    }
};
