// models/TicketMessage.js - Ticket Messages Model
const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
    ticket_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true
    },
    sender_type: {
        type: String,
        enum: ['user', 'support', 'system'],
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_name: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    
    // For internal notes (visible only to support agents)
    is_internal: {
        type: Boolean,
        default: false
    },
    
    // Attachments for this specific message
    attachments: [{
        file_name: String,
        file_url: String,
        file_type: String,
        file_size: Number
    }],
    
    // Read receipts
    read_by: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        read_at: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Metadata
    metadata: {
        ip_address: String,
        user_agent: String
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
    }
});

// Indexes
ticketMessageSchema.index({ ticket_id: 1, created_at: -1 });
ticketMessageSchema.index({ sender_id: 1, created_at: -1 });

// Pre-save hook to update ticket's last response info
ticketMessageSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Ticket = mongoose.model('Ticket');
        
        await Ticket.findByIdAndUpdate(this.ticket_id, {
            last_response_by: this.sender_type,
            last_response_at: new Date(),
            $inc: { response_count: 1 },
            updated_at: new Date()
        });
        
        // If this is the first support response, record first response time
        if (this.sender_type === 'support') {
            const ticket = await Ticket.findById(this.ticket_id);
            if (!ticket.first_response_at) {
                await Ticket.findByIdAndUpdate(this.ticket_id, {
                    first_response_at: new Date()
                });
            }
        }
    }
    next();
});

const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema);

module.exports = TicketMessage;
