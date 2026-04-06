import express from "express";
import { 
    addComment, 
    getComments, 
    getAllComments,
    replyComment, 
    deleteComment 
} from "../controllers/commentController.ts";

const commentRouter = express.Router();

// User APIs
commentRouter.post("/add", addComment);
commentRouter.get("/get", getComments); // Dùng query: ?roomTypeId=...

// Admin APIs
commentRouter.get("/all", getAllComments);
commentRouter.post("/reply", replyComment);
commentRouter.post("/delete", deleteComment);

export default commentRouter;
