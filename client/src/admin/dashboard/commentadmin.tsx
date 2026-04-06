import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { 
    fetchAllCommentsThunk, 
    replyCommentThunk, 
    toggleHideCommentThunk 
} from '@/lib/redux/reducers/comment';
import { 
    selectComments, 
    selectCommentLoading 
} from '@/lib/redux/reducers/comment/selectors';
import { Comment } from '@/lib/redux/reducers/comment/types';

const CommentAdmin: React.FC = () => {
    const dispatch = useAppDispatch();
    const comments = useAppSelector(selectComments);
    const loading = useAppSelector(selectCommentLoading);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterRating, setFilterRating] = useState<string>('All');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 10;

    // State cho Modal phản hồi
    const [isReplyModalOpen, setIsReplyModalOpen] = useState<boolean>(false);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [replyContent, setReplyContent] = useState<string>('');

    useEffect(() => {
        dispatch(fetchAllCommentsThunk());
    }, [dispatch]);

    const handleToggleHide = async (id: string) => {
        try {
            await dispatch(toggleHideCommentThunk({ commentId: id })).unwrap();
            toast.success("Đã cập nhật trạng thái hiển thị");
        } catch (error: any) {
            toast.error(error || "Lỗi khi cập nhật trạng thái");
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComment || !replyContent.trim()) return;

        try {
            await dispatch(replyCommentThunk({
                commentId: selectedComment._id,
                replyContent: replyContent
            })).unwrap();
            toast.success("Đã gửi phản hồi thành công");
            setIsReplyModalOpen(false);
            setReplyContent('');
        } catch (error: any) {
            toast.error(error || "Lỗi khi gửi phản hồi");
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRating('All');
        setCurrentPage(1);
    };

    const filteredComments = comments.filter(c => {
        const matchesSearch = 
            (c.userId?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.roomTypeId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.comment.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRating = filterRating === 'All' || c.rating === Number(filterRating);
        
        return matchesSearch && matchesRating;
    });

    const totalPages = Math.ceil(filteredComments.length / ITEMS_PER_PAGE);
    const paginatedComments = filteredComments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Quản lý đánh giá</h1>
                        <p className="text-sm text-gray-500 mt-1">Theo dõi, ẩn/hiện và phản hồi nhận xét của khách hàng</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white px-4 py-2 rounded-md border border-gray-200 shadow-sm flex items-center gap-3">
                            <span className="material-symbols-outlined text-amber-500 text-[20px]">star</span>
                            <div>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Rating trung bình</p>
                                <p className="text-sm font-bold text-gray-900">{(comments.reduce((acc, c) => acc + c.rating, 0) / (comments.length || 1)).toFixed(1)} / 5.0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-md border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo khách hàng, loại phòng hoặc nội dung..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>

                        <div className="md:col-span-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Xếp hạng (Số sao)</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:border-gray-400"
                                value={filterRating}
                                onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="All">Tất cả xếp hạng</option>
                                <option value="5">5 Sao - Xuất sắc</option>
                                <option value="4">4 Sao - Rất tốt</option>
                                <option value="3">3 Sao - Hài lòng</option>
                                <option value="2">2 Sao - Kém</option>
                                <option value="1">1 Sao - Tệ</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                onClick={clearFilters}
                                disabled={!searchTerm && filterRating === 'All'}
                                className="w-full py-2 px-3 border border-gray-200 text-gray-500 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {loading && comments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-md border border-gray-200">
                        <p className="text-gray-400 text-sm animate-pulse">Đang nạp dữ liệu...</p>
                    </div>
                ) : filteredComments.length === 0 ? (
                    <div className="bg-white rounded-md border border-gray-200 text-center py-12">
                        <p className="text-gray-400 text-sm">Không tìm thấy bình luận nào phù hợp</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Đánh giá</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedComments.map((comment) => (
                                    <tr key={comment._id} className={`hover:bg-gray-50 transition ${comment.isHidden ? 'bg-gray-50/50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {comment.userId?.avatar ? (
                                                        <img src={comment.userId.avatar} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-xs font-semibold text-gray-500">{(comment.userId?.full_name || '?').charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 line-clamp-1">{comment.userId?.full_name}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{comment.userId?.email || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-gray-700 font-medium">{comment.roomTypeId?.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-amber-500">{comment.rating}</span>
                                                <span className="material-symbols-outlined text-amber-400 text-[16px] fill-[1]">star</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <div>
                                                <p className="text-gray-600 line-clamp-2 leading-relaxed" title={comment.comment}>
                                                    {comment.comment}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1 italic">
                                                    {new Date(comment.createdAt).toLocaleDateString('vi-VN', { 
                                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                    })}
                                                </p>
                                                {comment.reply && (
                                                    <div className="mt-2 pl-3 border-l-2 border-blue-200">
                                                        <p className="text-[11px] text-blue-600 font-medium line-clamp-1">Phản hồi: {comment.reply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${comment.isHidden ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {comment.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => { setSelectedComment(comment); setReplyContent(comment.reply || ''); setIsReplyModalOpen(true); }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                                                    title="Phản hồi"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleHide(comment._id)}
                                                    className={`p-1.5 transition ${comment.isHidden ? 'text-emerald-500 hover:text-emerald-700' : 'text-gray-400 hover:text-rose-500'}`}
                                                    title={comment.isHidden ? "Hiện đánh giá" : "Ẩn đánh giá"}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {comment.isHidden ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Section */}
                {filteredComments.length > ITEMS_PER_PAGE && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredComments.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {isReplyModalOpen && selectedComment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Phản hồi khách hàng</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Khách hàng: {selectedComment.userId?.full_name}</p>
                            </div>
                            <button onClick={() => setIsReplyModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                        
                        <form onSubmit={handleReply} className="p-6 space-y-4">
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Đánh giá gốc</p>
                                <div className="flex items-center gap-1 mb-2">
                                    {[1,2,3,4,5].map(s => (
                                        <span key={s} className={`material-symbols-outlined text-[14px] ${s <= selectedComment.rating ? 'text-amber-400 fill-[1]' : 'text-gray-200'}`}>star</span>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 italic">"{selectedComment.comment}"</p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nội dung phản hồi từ khách sạn *</label>
                                <textarea
                                    rows={5}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 transition resize-none leading-relaxed"
                                    placeholder="Viết lời cảm ơn hoặc giải đáp thắc mắc cho khách hàng..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsReplyModalOpen(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition"
                                >
                                    Gửi phản hồi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentAdmin;
