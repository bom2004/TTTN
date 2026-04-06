/**
 * Custom Error class to handle operational errors in the application.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = "Yêu cầu không hợp lệ") {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Không có quyền truy cập") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Bạn không có quyền thực hiện hành động này") {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Không tìm thấy tài nguyên") {
        super(message, 404);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = "Lỗi hệ thống nội bộ") {
        super(message, 500);
    }
}
