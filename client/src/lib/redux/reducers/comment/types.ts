export interface Comment {
    _id: string;
    userId: {
        _id: string;
        full_name: string;
        avatar?: string;
        email?: string;
    };
    roomTypeId: {
        _id: string;
        name: string;
    };
    bookingId: string;
    rating: number;
    comment: string;
    reply?: string;
    isHidden: boolean;
    createdAt: string;
}

export interface CommentState {
    comments: Comment[];
    roomTypeComments: Comment[];
    loading: boolean;
    error: string | null;
}

export interface ReplyCommentPayload {
    commentId: string;
    replyContent: string;
}

export interface ToggleHideCommentPayload {
    commentId: string;
}
