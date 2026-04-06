import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import logger from "../utils/logger.ts";

/**
 * Global Error Handler Middleware
 * 
 * Standardizes all API error responses for better security and UX.
 */
export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || "Đã xảy ra lỗi hệ thống";

    // Professional logging with Metadata
    logger.error(`[API ERROR] ${req.method} ${req.url} - ${errorMessage}`, {
        statusCode,
        url: req.url,
        method: req.method,
        body: req.body,
        stack: err.stack,
    });

    // Response structure
    const response = {
        success: false,
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { 
            stack: err.stack,
            error: err
        }),
    };

    // Specific error handling for known codes (e.g. Multer)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: "File quá lớn! Vui lòng chọn ảnh dưới 5MB." });
    }
    
    if (errorMessage === 'Chỉ cho phép tải lên hình ảnh!') {
        return res.status(400).json({ success: false, message: errorMessage });
    }

    // Sending standard response
    res.status(statusCode).json(response);
};
