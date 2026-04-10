import crypto from "crypto";
import { sortObject, formatVNPayDate } from "../utils/vnpayUtils.ts";

/**
 * Service xử lý các thao tác liên quan đến VNPay API
 */
export const generateVNPayPaymentUrl = (
    userId: string,
    amount: number,
    orderId: string,
    ipAddr: string,
    orderInfo?: string
) => {
    const date = new Date();
    const createDate = formatVNPayDate(date);
    const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60000));

    const tmnCode = process.env.VNP_TMN_CODE!;
    const secretKey = process.env.VNP_HASH_SECRET!;
    const vnpUrl = process.env.VNP_URL!;
    const returnUrl = process.env.VNP_RETURN_URL!;

    let vnp_Params: Record<string, any> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo || `NapTien_${userId}_${amount}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&');
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    return `${vnpUrl}?${Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&')}`;
};

/**
 * Service xác thực chữ ký trả về từ VNPay Chatbot
 */
export const verifyVNPaySignature = (queryParams: Record<string, any>) => {
    let vnp_Params: Record<string, any> = { ...queryParams };
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET!;
    const signData = Object.entries(vnp_Params).map(([key, val]) => `${key}=${val}`).join('&');
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    return secureHash === signed;
};
