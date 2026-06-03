const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    // Thông tin session
    sessionId: {
        type: String,
        required: true,
        index: true  // Index để query nhanh
    },
    
    dwell_time : {type: Number},
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Loại sự kiện
    eventType: {
        type: String,
        required: true,
        enum: [
            'page_view',
            'page_leave',
            'post_view_start',
            'post_view_end',
            'post_impression',
            'like_post',
            'open_comments',
            'close_comments',
            'share_click',
            'profile_click',
            'view_all_comments_click',
            'scroll'
        ],
        index: true
    },
    
    // Timestamp
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        index: true  // Index để query theo thời gian
    },
    postId: {type: String},
    target_userID: {type: String }, 
    // Soft delete
    isDeleted: { type: Boolean,default: false }
}, {
    timestamps: true  // Tự động tạo createdAt, updatedAt
});
module.exports = mongoose.model('interaction', interactionSchema);