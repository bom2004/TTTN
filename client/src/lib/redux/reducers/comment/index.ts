import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import { Comment, CommentState, ReplyCommentPayload, ToggleHideCommentPayload } from './types.ts';

const initialState: CommentState = {
    comments: [],
    roomTypeComments: [],
    loading: false,
    error: null,
};

// Admin Thunks
export const fetchAllCommentsThunk = createAsyncThunk(
    'comment/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get('/api/comments/all');
            return res.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách bình luận');
        }
    }
);

// User Thunks
export const fetchCommentsByRoomTypeThunk = createAsyncThunk(
    'comment/fetchByRoomType',
    async (roomTypeId: string, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.get(`/api/comments/get?roomTypeId=${roomTypeId}`);
            return res.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi tải đánh giá');
        }
    }
);

export const replyCommentThunk = createAsyncThunk(
    'comment/reply',
    async (payload: ReplyCommentPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/comments/reply', payload);
            return res.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi gửi phản hồi');
        }
    }
);

export const toggleHideCommentThunk = createAsyncThunk(
    'comment/toggleHide',
    async (payload: ToggleHideCommentPayload, { rejectWithValue }) => {
        try {
            const res = await axiosInstance.post('/api/comments/delete', payload);
            return { commentId: payload.commentId, data: res.data.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    }
);

const commentSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {
        clearRoomComments: (state) => {
            state.roomTypeComments = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAllCommentsThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAllCommentsThunk.fulfilled, (state, action: PayloadAction<Comment[]>) => {
                state.loading = false;
                state.comments = action.payload;
            })
            .addCase(fetchAllCommentsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch By RoomType
            .addCase(fetchCommentsByRoomTypeThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCommentsByRoomTypeThunk.fulfilled, (state, action: PayloadAction<Comment[]>) => {
                state.loading = false;
                state.roomTypeComments = action.payload;
            })
            .addCase(fetchCommentsByRoomTypeThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Reply
            .addCase(replyCommentThunk.fulfilled, (state, action: PayloadAction<Comment>) => {
                const index = state.comments.findIndex(c => c._id === action.payload._id);
                if (index !== -1) {
                    state.comments[index] = action.payload;
                }
            })
            // Toggle Hide
            .addCase(toggleHideCommentThunk.fulfilled, (state, action: PayloadAction<{ commentId: string, data: Comment }>) => {
                const index = state.comments.findIndex(c => c._id === action.payload.commentId);
                if (index !== -1) {
                    state.comments[index] = action.payload.data;
                }
                // Nếu khách hàng cũng đang xem cùng lúc, cập nhật cả state RoomType
                const rtIndex = state.roomTypeComments.findIndex(c => c._id === action.payload.commentId);
                if (rtIndex !== -1) {
                    if (action.payload.data.isHidden) {
                        state.roomTypeComments.splice(rtIndex, 1);
                    } else {
                        state.roomTypeComments[rtIndex] = action.payload.data;
                    }
                }
            });
    }
});

export const { clearRoomComments } = commentSlice.actions;
export default commentSlice.reducer;
