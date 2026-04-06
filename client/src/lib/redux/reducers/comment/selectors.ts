import { RootState } from "../../store";

export const selectComments = (state: RootState) => state.comment.comments;
export const selectRoomComments = (state: RootState) => state.comment.roomTypeComments;
export const selectCommentLoading = (state: RootState) => state.comment.loading;
export const selectCommentError = (state: RootState) => state.comment.error;
