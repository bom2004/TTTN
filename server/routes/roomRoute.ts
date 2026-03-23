import express from "express";
import { addRoom, getAllRooms, updateRoom, deleteRoom, searchRooms } from "../controllers/roomController.ts";
import upload from "../middlewares/multer.ts";

const roomRouter = express.Router();

roomRouter.get("/search", searchRooms);

roomRouter.post("/", upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]), addRoom);
roomRouter.get("/", getAllRooms);
roomRouter.put("/:id", upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 10 }]), updateRoom);

roomRouter.delete("/:id", deleteRoom);

export default roomRouter;
