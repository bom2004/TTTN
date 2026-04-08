import express from "express";
import { 
    allUsers, 
    changeRole, 
    adminUpdatePassword, 
    adminCreateUser, 
    adminUpdateUser, 
    deleteUser, 
    getUser
} from "../controllers/userController.ts";
import { updateProfile } from "../controllers/updateUserController.ts";
import { uploadImage } from "../middlewares/multer.ts";

const userRouter = express.Router();

userRouter.post("/update-profile", uploadImage.single("avatar"), updateProfile);
userRouter.get("/profile/:userId", getUser);
userRouter.get("/all-users", allUsers);
userRouter.post("/change-role", changeRole);
userRouter.post("/admin-update-password", adminUpdatePassword);
userRouter.post("/admin-create-user", uploadImage.single("avatar"), adminCreateUser);
userRouter.post("/admin-update-user", uploadImage.single("avatar"), adminUpdateUser);
userRouter.post("/delete-user", deleteUser);

export default userRouter;
