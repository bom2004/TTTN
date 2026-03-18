import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Xác nhận xóa',
    cancelLabel = 'Hủy bỏ',
    onConfirm,
    onCancel,
    type = 'danger',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal Box */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Top accent bar */}
                <div className={`h-1.5 w-full ${type === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`} />

                {/* Content */}
                <div className="p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                        type === 'danger' ? 'bg-rose-50' : 'bg-amber-50'
                    }`}>
                        <span className={`material-symbols-outlined text-4xl ${
                            type === 'danger' ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                            {type === 'danger' ? 'delete_forever' : 'warning'}
                        </span>
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-black text-[#003580] text-center mb-2 tracking-tight">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">
                        {message}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold text-white transition-all active:scale-95 shadow-md ${
                                type === 'danger'
                                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                            }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
