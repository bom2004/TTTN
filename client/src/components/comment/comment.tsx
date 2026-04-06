import React, { useEffect } from "react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../lib/redux/store";
import { fetchCommentsByRoomTypeThunk, clearRoomComments } from "../../lib/redux/reducers/comment";
import { selectRoomComments, selectCommentLoading } from "../../lib/redux/reducers/comment/selectors";

interface CommentProps {
    roomTypeId: string;
}

const CommentSection: React.FC<CommentProps> = ({ roomTypeId }) => {
    const dispatch = useAppDispatch();
    const comments = useAppSelector(selectRoomComments);
    const loading = useAppSelector(selectCommentLoading);

    useEffect(() => {
        if (roomTypeId) {
            dispatch(fetchCommentsByRoomTypeThunk(roomTypeId));
        }
        return () => {
            dispatch(clearRoomComments());
        };
    }, [dispatch, roomTypeId]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-symbols-outlined text-sm ${star <= rating ? "text-[#febb02]" : "text-gray-300"
                            }`}
                        style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                    >
                        star
                    </span>
                ))}
            </div>
        );
    };

    if (loading && comments.length === 0) {
        return (
            <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="mt-6">
            {/* Header kiểu Facebook */}
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                <span className="material-symbols-outlined text-xl text-gray-500">chat_bubble</span>
                <h3 className="text-base font-semibold text-gray-800">
                    Đánh giá <span className="text-gray-400 text-sm font-normal">({comments.length})</span>
                </h3>
            </div>

            {comments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-gray-300">forum</span>
                    <p className="text-gray-400 text-sm mt-2">Chưa có đánh giá nào.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {comments.map((item) => (
                        <div key={item._id} className="flex gap-3">
                            {/* Avatar tròn nhỏ kiểu FB */}
                            <div className="flex-shrink-0">
                                {item.userId?.avatar ? (
                                    <img
                                        src={item.userId.avatar}
                                        alt={item.userId?.full_name}
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                        {(item.userId?.full_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Nội dung bình luận */}
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl px-4 py-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-gray-900">
                                            {item.userId?.full_name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {dayjs(item.createdAt).format("DD/MM/YYYY")}
                                        </span>
                                    </div>
                                    {renderStars(item.rating)}
                                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                        {item.comment}
                                    </p>
                                </div>

                                {/* Phản hồi admin (kiểu comment con) */}
                                {item.reply && (
                                    <div className="flex gap-3 mt-2 ml-4">
                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                            KS
                                        </div>
                                        <div className="flex-1 bg-gray-50/70 rounded-2xl px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-blue-700">Khách sạn</span>
                                                <span className="text-[10px] text-gray-400">phản hồi</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{item.reply}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentSection;