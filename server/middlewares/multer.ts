import multer from "multer";

const storage = multer.memoryStorage();

// Middleware upload cho ảnh (như cũ)
export const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (_req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ cho phép tải lên hình ảnh!"));
        }
    },
});

// Middleware upload cho Excel
export const uploadExcel = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

export default uploadImage;
