const express = require('express');
const trackingRouter = express.Router();
const Interraction = require('../../../models/interaction');

// ✅ POST: Lưu analytics (batch)
trackingRouter.post('/track/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const analyticsData = req.body;  // Array of events
        
        // Validate
        if (!Array.isArray(analyticsData) || analyticsData.length === 0) {
            return res.status(400).json({
                status: 400,
                message: 'Invalid data format. Expected array of events.'
            });
        }
        
        
        const documentsToInsert = analyticsData.map(event => ({
            ...event,
            userID,
            timestamp: new Date(event.timestamp),
          
        }));
        
        const result = await Interraction.insertMany(documentsToInsert, {
            ordered: false  // Tiếp tục insert nếu có lỗi 1 document
        });
        
        res.status(201).json({
            status: 201,
            message: 'Analytics tracked successfully',
            data: {
                insertedCount: result.length
            }
        });
        
    } catch (error) {
        console.error('Error tracking analytics:', error);
        res.status(500).json({
            status: 500,
            message: 'Failed to track analytics',
            error: error.message
        });
    }
});


//  Lấy analytics theo session
trackingRouter.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const analytics = await Interraction.find({ sessionId })
            .sort({ timestamp: 1 })  // Sort theo thời gian tăng dần
            .lean();
        
        res.json({
            status: 200,
            data: analytics
        });
        
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch analytics',
            error: error.message
        });
    }
});


// GET: Analytics overview (dashboard)
trackingRouter.get('/overview', async (req, res) => {
    try {
        const { startDate, endDate, eventType } = req.query;
        
        // Build query
        const query = {};
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        if (eventType) {
            query.eventType = eventType;
        }
        
        // Aggregate statistics
        const stats = await Interraction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    uniqueSessions: { $addToSet: '$sessionId' }
                }
            },
            {
                $project: {
                    eventType: '$_id',
                    count: 1,
                    uniqueSessions: { $size: '$uniqueSessions' }
                }
            }
        ]);
        
        res.json({
            status: 200,
            data: stats
        });
        
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch overview',
            error: error.message
        });
    }
});


//  GET: Post performance
trackingRouter.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
        const postAnalytics = await Interraction.aggregate([
            {
                $match: {
                    'data.postId': postId,
                    eventType: { $in: ['post_view_end', 'like_post', 'open_comments'] }
                }
            },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    avgViewDuration: {
                        $avg: {
                            $cond: [
                                { $eq: ['$eventType', 'post_view_end'] },
                                '$data.viewDuration',
                                null
                            ]
                        }
                    }
                }
            }
        ]);
        
        res.json({
            status: 200,
            data: {
                postId,
                analytics: postAnalytics
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch post analytics',
            error: error.message
        });
    }
});


// DELETE: Xóa analytics cũ (cleanup job)
trackingRouter.delete('/cleanup', async (req, res) => {
    try {
        const { daysOld = 90 } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysOld));
        
        const result = await Interraction.deleteMany({
            timestamp: { $lt: cutoffDate }
        });
        
        res.json({
            status: 200,
            message: `Deleted analytics older than ${daysOld} days`,
            data: {
                deletedCount: result.deletedCount
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Failed to cleanup analytics',
            error: error.message
        });
    }
});


module.exports = trackingRouter;