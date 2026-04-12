import mongoose from "mongoose";
import serviceCategoryModel from "../models/servicebooking/serviceCategoryModel";
import serviceModel from "../models/servicebooking/serviceModel";
import serviceOrderModel from "../models/servicebooking/serviceOrderModel";
import bookingModel from "../models/bookingModel";
import roomModel from "../models/roomModel";
import bookingDetailModel from "../models/bookingDetailModel";

export const getAllCategoriesService = async () => {
    return await serviceCategoryModel.find().sort({ name: 1 });
};

export const getServicesService = async (categoryId?: string) => {
    const filter = categoryId ? { categoryId } : {};
    return await serviceModel.find(filter).populate("categoryId").sort({ name: 1 });
};

export const createCategoryService = async (data: any) => {
    const newCategory = new serviceCategoryModel(data);
    return await newCategory.save();
};

export const createServiceItemService = async (data: any) => {
    const newService = new serviceModel(data);
    return await newService.save();
};

export const updateCategoryService = async (id: string, data: any) => {
    const updated = await serviceCategoryModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new Error("Không tìm thấy danh mục");
    return updated;
};

export const deleteCategoryService = async (id: string) => {
    const deleted = await serviceCategoryModel.findByIdAndDelete(id);
    if (!deleted) throw new Error("Không tìm thấy danh mục");
    await serviceModel.deleteMany({ categoryId: id });
    return deleted;
};

export const updateServiceItemService = async (id: string, data: any) => {
    const updated = await serviceModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new Error("Không tìm thấy dịch vụ");
    return updated;
};

export const deleteServiceItemService = async (id: string) => {
    const deleted = await serviceModel.findByIdAndDelete(id);
    if (!deleted) throw new Error("Không tìm thấy dịch vụ");
    return deleted;
};

export const createOrderService = async (data: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { bookingId, roomId, items, note, paymentStatus } = data;

        if (!bookingId || !roomId || !items || items.length === 0) {
            throw new Error("Thiếu thông tin đặt hàng.");
        }

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

        const populatedOrder = await serviceOrderModel.findById(newOrder._id)
            .populate('roomId', 'roomNumber')
            .populate('items.serviceId', 'name');

        return populatedOrder;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getOrdersService = async (bookingId?: string, status?: string) => {
    const filter: any = {};
    if (bookingId) filter.bookingId = bookingId;
    if (status) filter.status = status;

    return await serviceOrderModel.find(filter)
        .populate('roomId', 'roomNumber')
        .populate('bookingId', 'customerInfo')
        .populate('items.serviceId', 'name image unit')
        .sort({ createdAt: -1 });
};

export const updateOrderStatusService = async (id: string, status: string, paymentStatus?: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const oldOrder = await serviceOrderModel.findById(id).session(session);
        if (!oldOrder) {
            throw new Error("Không tìm thấy đơn hàng.");
        }

        const updateFields: any = { status };
        if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;

        const updatedOrder = await serviceOrderModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, session, runValidators: false }
        ).populate('roomId', 'roomNumber').populate('items.serviceId', 'name');

        if (!updatedOrder) {
            throw new Error("Lỗi khi cập nhật đơn hàng.");
        }

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
        return updatedOrder;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getOccupiedRoomsService = async () => {
    const rooms = await roomModel.find({ status: "occupied" }).populate("roomTypeId");
    
    const results = await Promise.all(rooms.map(async (room) => {
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

    return results.filter(item => item.booking !== null);
};
