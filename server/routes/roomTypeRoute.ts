import express from "express";
import { addRoomType, getAllRoomTypes, updateRoomType, deleteRoomType } from "../controllers/roomTypeController.ts";
import upload from "../middlewares/multer.ts";

const roomTypeRouter = express.Router();

roomTypeRouter.post('/', upload.single('image'), addRoomType); // POST /api/room-types
roomTypeRouter.get('/', getAllRoomTypes); // GET /api/room-types
roomTypeRouter.put('/:id', upload.single('image'), updateRoomType); // PUT /api/room-types/:id
roomTypeRouter.delete('/:id', deleteRoomType); // DELETE /api/room-types/:id

export default roomTypeRouter;
