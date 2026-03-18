import express from "express";
import {
    savePromotion,
    getPromotions,
    togglePromotionStatus,
    deletePromotion,
    validatePromotion
} from "../controllers/promotionController.ts";
import upload from "../middlewares/multer.ts";

const promotionRouter = express.Router();

// Admin routes
promotionRouter.post("/", upload.single('image'), savePromotion);
promotionRouter.put("/:id", upload.single('image'), savePromotion);
promotionRouter.get("/", getPromotions);
promotionRouter.put("/:id/toggle-status", togglePromotionStatus);
promotionRouter.delete("/:id", deletePromotion);

// Client route
promotionRouter.post("/validate", validatePromotion);
promotionRouter.get("/user-history/:userId", async (req: express.Request, res: express.Response) => {
    const { getUserPromotionHistory } = await import("../controllers/promotionController.ts");
    return getUserPromotionHistory(req, res);
});

export default promotionRouter;
