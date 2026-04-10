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
        if (!id) return;
        try {
            await dispatch(toggleHideCommentThunk({ commentId: id })).unwrap();
            toast.success("Đã cập nhật trạng thái hiển thị");
            // Refresh lại dữ liệu để đảm bảo các thống kê được cập nhật chính xác
            dispatch(fetchAllCommentsThunk());
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
            dispatch(fetchAllCommentsThunk());
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

    const getAverageRating = () => {
        if (comments.length === 0) return 0;
        return (comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1);
    };

    const getStats = () => {
        return {
            total: comments.length,
            average: getAverageRating(),
            visible: comments.filter(c => !c.isHidden).length,
            hidden: comments.filter(c => c.isHidden).length
        };
    };

    const stats = getStats();

    return (
        <div className="p-8 bg-[#f5f7f9] dark:bg-slate-900 min-h-screen">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Quản lý đánh giá</h2>
                        <p className="text-[#595c5e] dark:text-slate-400 mt-1 font-['Inter',sans-serif]">Theo dõi, ẩn/hiện và phản hồi nhận xét của khách hàng.</p>
                    </div>
                </div>

                {/* Statistics Overview Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#0050d4] flex items-center justify-center">
                            <span className="material-symbols-outlined">forum</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Tổng bình luận</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Rating trung bình</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.average} / 5.0</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">visibility</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đang hiển thị</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.visible}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-transparent flex items-center gap-4 shadow-sm transition-all hover:shadow-md">
                        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">visibility_off</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#595c5e] dark:text-slate-400 uppercase">Đang ẩn</p>
                            <p className="text-2xl font-bold text-[#2c2f31] dark:text-slate-100">{stats.hidden}</p>
                        </div>
                    </div>
                </div>

                {/* Table & Filters Section */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-transparent overflow-hidden shadow-sm">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-[#e5e9eb] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder="Tìm khách hàng, loại phòng hoặc nội dung..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-11 pr-4 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0050d4] transition-all text-[#2c2f31] dark:text-slate-100 placeholder-[#abadaf]"
                            />
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#abadaf] text-[20px]">search</span>
                        </div>

                        {/* Filters & Actions */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            {/* Rating Filter */}
                            <div className="relative flex-1 md:flex-none">
                                <select
                                    value={filterRating}
                                    onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
                                    className="w-full appearance-none pl-10 pr-10 py-2 border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-200 focus:ring-2 focus:ring-[#0050d4]/20 cursor-pointer transition-all min-w-[180px]"
                                >
                                    <option value="All">Xếp hạng: Tất cả</option>
                                    <option value="5">5 Sao - Xuất sắc</option>
                                    <option value="4">4 Sao - Rất tốt</option>
                                    <option value="3">3 Sao - Hài lòng</option>
                                    <option value="2">2 Sao - Kém</option>
                                    <option value="1">1 Sao - Tệ</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">star</span>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#747779] text-lg pointer-events-none">expand_more</span>
                            </div>

                            {/* Clear Filters */}
                            <button 
                                onClick={clearFilters}
                                disabled={!searchTerm && filterRating === 'All'}
                                className="px-4 py-2 flex items-center justify-center border border-[#d9dde0] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl hover:bg-[#eef1f3] dark:hover:bg-slate-700 text-[#4e5c71] dark:text-slate-400 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loading && comments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="w-12 h-12 bg-[#e5e9eb] dark:bg-slate-700 rounded-full mb-4"></div>
                                <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : filteredComments.length === 0 ? (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-5xl text-[#abadaf] dark:text-slate-500 mb-3">chat_bubble_outline</span>
                            <p className="text-[#747779] dark:text-slate-400 text-sm font-medium">Không tìm thấy bình luận nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#eef1f3]/50 dark:bg-slate-900/50">
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Khách hàng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Loại phòng</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Đánh giá</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Nội dung</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider font-['Manrope',sans-serif]">Trạng thái</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wider text-right font-['Manrope',sans-serif]">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e9eb] dark:divide-slate-700">
                                    {paginatedComments.map((comment) => (
                                        <tr key={comment._id} className="hover:bg-[#f5f7f9] dark:hover:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#e5e9eb] dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                                        {comment.userId?.avatar ? (
                                                            <img src={comment.userId.avatar} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[#595c5e] dark:text-slate-400 font-bold">
                                                                {(comment.userId?.full_name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#2c2f31] dark:text-slate-100 line-clamp-1">{comment.userId?.full_name}</p>
                                                        <p className="text-xs text-[#747779] dark:text-slate-400">{comment.userId?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4e5c71] dark:text-slate-400 font-bold">
                                                {comment.roomTypeId?.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm font-extrabold text-[#2c2f31] dark:text-slate-100">{comment.rating}</span>
                                                    <span className="material-symbols-outlined text-amber-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-[#4e5c71] dark:text-slate-300 line-clamp-2 leading-relaxed" title={comment.comment}>
                                                        {comment.comment}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-[#abadaf] dark:text-slate-500 font-medium italic">
                                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN', { 
                                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                                            })}
                                                        </span>
                                                        {comment.reply && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] text-[#0050d4] dark:text-blue-400 font-bold">
                                                                <span className="material-symbols-outlined text-[12px]">reply</span>
                                                                Đã phản hồi
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${comment.isHidden ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${comment.isHidden ? 'bg-red-600' : 'bg-green-600'}`}></span>
                                                    {comment.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => { setSelectedComment(comment); setReplyContent(comment.reply || ''); setIsReplyModalOpen(true); }}
                                                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-[#747779] hover:text-[#0050d4] transition-all active:scale-90"
                                                        title="Phản hồi"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">edit_note</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleHide(comment._id)}
                                                        className={`p-2 rounded-lg transition-all active:scale-90 ${comment.isHidden ? 'hover:bg-green-50 text-[#747779] hover:text-green-600 dark:hover:bg-green-900/20' : 'hover:bg-red-50 text-[#747779] hover:text-red-600 dark:hover:bg-red-900/20'}`}
                                                        title={comment.isHidden ? "Hiện đánh giá" : "Ẩn đánh giá"}
                                                    >
                                                        <span className="material-symbols-outlined text-xl">
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
                    {filteredComments.length > 0 && (
                        <div className="px-6 py-4 border-t border-[#e5e9eb] dark:border-slate-700 flex items-center justify-between">
                            <p className="text-xs font-medium text-[#747779] dark:text-slate-400">
                                Hiển thị <span className="text-[#2c2f31] dark:text-slate-100">{paginatedComments.length}</span> trên <span className="text-[#2c2f31] dark:text-slate-100">{filteredComments.length}</span> bình luận
                            </p>
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

                {/* Info Card / Bento Item */}
                <div className="mt-8 bg-[#eef1f3]/50 dark:bg-slate-800/50 p-8 rounded-2xl border border-dashed border-[#d9dde0] dark:border-slate-700 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-[#0050d4]">
                        <span className="material-symbols-outlined text-3xl">rate_review</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Xây dựng uy tín khách sạn</h3>
                        <p className="text-sm text-[#4e5c71] dark:text-slate-400 max-w-md mx-auto">Phản hồi bình luận khách hàng một cách chuyên nghiệp giúp tăng tỷ lệ đặt phòng và sự tin dùng từ cộng đồng.</p>
                    </div>
                </div>
            </div>

            {/* Reply Modal */}
            {isReplyModalOpen && selectedComment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-[#e5e9eb] dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#2c2f31] dark:text-slate-100 font-['Manrope',sans-serif]">Phản hồi khách hàng</h2>
                                <p className="text-xs text-[#747779] dark:text-slate-400 mt-0.5 font-medium">Khách hàng: {selectedComment.userId?.full_name}</p>
                            </div>
                            <button 
                                onClick={() => setIsReplyModalOpen(false)} 
                                className="w-8 h-8 flex items-center justify-center text-[#747779] hover:text-[#2c2f31] dark:hover:text-slate-200 hover:bg-[#eef1f3] dark:hover:bg-slate-700 rounded-lg transition-all text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleReply} className="p-6 space-y-6">
                            <div className="p-4 bg-[#f8fafb] dark:bg-slate-900/50 rounded-xl border border-[#e5e9eb] dark:border-slate-700">
                                <p className="text-[10px] text-[#595c5e] dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Đánh giá từ khách hàng</p>
                                <div className="flex items-center gap-1 mb-2">
                                    {[1,2,3,4,5].map(s => (
                                        <span key={s} className={`material-symbols-outlined text-[16px] ${s <= selectedComment.rating ? 'text-amber-400' : 'text-[#d9dde0] dark:text-slate-700'}`} style={{ fontVariationSettings: s <= selectedComment.rating ? "'FILL' 1" : "" }}>star</span>
                                    ))}
                                </div>
                                <p className="text-sm text-[#4e5c71] dark:text-slate-300 italic">"{selectedComment.comment}"</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-[#595c5e] dark:text-slate-400 uppercase tracking-wide">Nội dung phản hồi của bạn *</label>
                                <textarea
                                    rows={5}
                                    className="w-full px-4 py-3 border border-[#d9dde0] dark:border-slate-700 rounded-xl text-sm font-medium text-[#2c2f31] dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#0050d4] transition-all resize-none leading-relaxed"
                                    placeholder="Viết lời cảm ơn hoặc giải đáp thắc mắc cho khách hàng..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReplyModalOpen(false)}
                                    className="flex-1 py-3 border border-[#d9dde0] dark:border-slate-700 text-[#2c2f31] dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-[#f5f7f9] dark:hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gradient-to-r from-[#0050d4] to-[#0046bb] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">send</span>
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
