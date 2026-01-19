// models/Ticket.js - Support Ticket System Model
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    // Basic Ticket Information
    ticket_number: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    
    // Ticket Category & Type
    category: {
        type: String,
        required: true,
        enum: [
            'account',          // Account related issues
            'technical',        // Technical problems
            'payment',          // Payment issues
            'tournament',       // Tournament related
            'gameplay',         // Gameplay issues
            'bug_report',       // Bug reports
            'feature_request',  // Feature requests
            'refund',           // Refund requests
            'verification',     // Verification issues
            'other'             // Other issues
        ],
        default: 'other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // User Information
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    user_name: {
        type: String,
        required: true
    },
    user_email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    
    // Status & Assignment
    status: {
        type: String,
        enum: [
            'open',             // New ticket, not assigned
            'assigned',         // Assigned to support agent
            'in_progress',      // Being worked on
            'waiting_customer', // Waiting for customer response
            'waiting_third',    // Waiting for third party
            'resolved',         // Issue resolved
            'closed',           // Ticket closed
            'reopened',         // Ticket reopened after closure
            'cancelled'         // Ticket cancelled
        ],
        default: 'open',
        index: true
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assigned_at: {
        type: Date,
        default: null
    },
    
    // Response Information
    last_response_by: {
        type: String,
        enum: ['user', 'support', 'system'],
        default: 'user'
    },
    last_response_at: {
        type: Date,
        default: Date.now
    },
    response_count: {
        type: Number,
        default: 1
    },
    
    // Attachments
    attachments: [{
        file_name: String,
        file_url: String,
        file_type: String,
        file_size: Number,
        uploaded_at: {
            type: Date,
            default: Date.now
        },
        uploaded_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Metadata
    metadata: {
        browser: String,
        os: String,
        device: String,
        ip_address: String,
        user_agent: String
    },
    
    // Resolution Details
    resolution_notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    resolved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolved_at: {
        type: Date
    },
    closed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    closed_at: {
        type: Date
    },
    
    // SLA (Service Level Agreement)
    sla_due_at: {
        type: Date
    },
    sla_breached: {
        type: Boolean,
        default: false
    },
    first_response_at: {
        type: Date
    },
    
    // Timestamps
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { 
        createdAt: 'created_at', 
        updatedAt: 'updated_at' 
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for Ticket Messages
ticketSchema.virtual('messages', {
    ref: 'TicketMessage',
    localField: '_id',
    foreignField: 'ticket_id',
    justOne: false
});

// Virtual for User
ticketSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

// Virtual for Assigned Agent
ticketSchema.virtual('agent', {
    ref: 'User',
    localField: 'assigned_to',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Generate sequence number
        const lastTicket = await this.constructor.findOne(
            { ticket_number: new RegExp(`^TKT${year}${month}${day}`) },
            { ticket_number: 1 },
            { sort: { ticket_number: -1 } }
        );
        
        let sequence = '001';
        if (lastTicket) {
            const lastSeq = lastTicket.ticket_number.slice(-3);
            sequence = (parseInt(lastSeq) + 1).toString().padStart(3, '0');
        }
        
        this.ticket_number = `TKT${year}${month}${day}${sequence}`;
        
        // Calculate SLA due date (24 hours for urgent, 48 for high, 72 for medium, 96 for low)
        const slaHours = {
            urgent: 24,
            high: 48,
            medium: 72,
            low: 96
        };
        
        this.sla_due_at = new Date(date.getTime() + (slaHours[this.priority] || 72) * 60 * 60 * 1000);
    }
    
    this.updated_at = new Date();
    next();
});

// Method to check if SLA is breached
ticketSchema.methods.checkSLA = function() {
    if (this.status === 'closed' || this.status === 'resolved' || this.status === 'cancelled') {
        return false;
    }
    
    const now = new Date();
    if (this.sla_due_at && now > this.sla_due_at) {
        this.sla_breached = true;
        return true;
    }
    return false;
};

// Method to calculate response time
ticketSchema.methods.calculateFirstResponseTime = function() {
    if (this.first_response_at) {
        return Math.floor((this.first_response_at - this.created_at) / (1000 * 60)); // in minutes
    }
    return null;
};

// Method to get ticket age
ticketSchema.methods.getTicketAge = function() {
    const now = new Date();
    const created = new Date(this.created_at);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        total_minutes: Math.floor(diffMs / (1000 * 60))
    };
};

// Static method to get statistics
ticketSchema.statics.getStatistics = async function(userId = null, startDate = null, endDate = null) {
    const match = {};
    
    if (userId) {
        match.user_id = new mongoose.Types.ObjectId(userId);
    }
    
    if (startDate && endDate) {
        match.created_at = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total_tickets: { $sum: 1 },
                open_tickets: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['open', 'assigned', 'in_progress', 'waiting_customer', 'waiting_third', 'reopened']] }, 1, 0]
                    }
                },
                closed_tickets: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['closed', 'resolved']] }, 1, 0]
                    }
                },
                urgent_tickets: {
                    $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
                },
                high_tickets: {
                    $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
                },
                medium_tickets: {
                    $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
                },
                low_tickets: {
                    $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
                },
                sla_breached_tickets: {
                    $sum: { $cond: ['$sla_breached', 1, 0] }
                },
                avg_response_time: {
                    $avg: {
                        $cond: [
                            { $ne: ['$first_response_at', null] },
                            { $subtract: ['$first_response_at', '$created_at'] },
                            null
                        ]
                    }
                }
            }
        },
        {
            $project: {
                total_tickets: 1,
                open_tickets: 1,
                closed_tickets: 1,
                urgent_tickets: 1,
                high_tickets: 1,
                medium_tickets: 1,
                low_tickets: 1,
                sla_breached_tickets: 1,
                avg_response_time_minutes: {
                    $round: [{ $divide: ['$avg_response_time', 1000 * 60] }, 2]
                }
            }
        }
    ]);
    
    return stats[0] || {
        total_tickets: 0,
        open_tickets: 0,
        closed_tickets: 0,
        urgent_tickets: 0,
        high_tickets: 0,
        medium_tickets: 0,
        low_tickets: 0,
        sla_breached_tickets: 0,
        avg_response_time_minutes: 0
    };
};

// Static method to get category distribution
ticketSchema.statics.getCategoryDistribution = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                open: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['open', 'assigned', 'in_progress', 'waiting_customer', 'waiting_third', 'reopened']] }, 1, 0]
                    }
                },
                closed: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['closed', 'resolved']] }, 1, 0]
                    }
                }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Static method to get agent performance
ticketSchema.statics.getAgentPerformance = async function(startDate = null, endDate = null) {
    const match = { assigned_to: { $ne: null } };
    
    if (startDate && endDate) {
        match.created_at = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    return await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$assigned_to',
                total_assigned: { $sum: 1 },
                resolved: {
                    $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] }
                },
                avg_resolution_time: {
                    $avg: {
                        $cond: [
                            { $and: [
                                { $in: ['$status', ['resolved', 'closed']] },
                                { $ne: ['$resolved_at', null] }
                            ]},
                            { $subtract: ['$resolved_at', '$assigned_at'] },
                            null
                        ]
                    }
                },
                sla_breached: {
                    $sum: { $cond: ['$sla_breached', 1, 0] }
                },
                avg_response_time: {
                    $avg: {
                        $cond: [
                            { $ne: ['$first_response_at', null] },
                            { $subtract: ['$first_response_at', '$created_at'] },
                            null
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'agent_info'
            }
        },
        { $unwind: '$agent_info' },
        {
            $project: {
                agent_id: '$_id',
                agent_name: '$agent_info.username',
                agent_email: '$agent_info.email',
                total_assigned: 1,
                resolved: 1,
                resolution_rate: {
                    $multiply: [
                        { $divide: ['$resolved', '$total_assigned'] },
                        100
                    ]
                },
                avg_resolution_time_hours: {
                    $round: [{ $divide: ['$avg_resolution_time', 1000 * 60 * 60] }, 2]
                },
                avg_response_time_minutes: {
                    $round: [{ $divide: ['$avg_response_time', 1000 * 60] }, 2]
                },
                sla_breached: 1
            }
        },
        { $sort: { resolution_rate: -1 } }
    ]);
};

// Indexes for better performance
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ user_id: 1, created_at: -1 });
ticketSchema.index({ assigned_to: 1, status: 1 });
ticketSchema.index({ ticket_number: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ created_at: -1 });
ticketSchema.index({ sla_due_at: 1 });
ticketSchema.index({ priority: 1, status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
