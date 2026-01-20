// utils/emailService.js - Complete Email Service with Templates
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const ejs = require('ejs');

class EmailService {
    constructor() {
        // Email configuration
        this.config = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            from: {
                name: process.env.EMAIL_FROM_NAME || 'XOSS Gaming',
                address: process.env.EMAIL_FROM_ADDRESS || 'noreply@xossgaming.com'
            }
        };

        // Initialize transporter
        this.transporter = nodemailer.createTransport(this.config);

        // Verify connection
        this.verifyConnection();

        // Email templates directory
        this.templatesDir = path.join(__dirname, '../templates/emails');
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connected successfully');
        } catch (error) {
            console.error('❌ Email connection failed:', error.message);
        }
    }

    /**
     * Render email template
     */
    async renderTemplate(templateName, data = {}) {
        try {
            const templatePath = path.join(this.templatesDir, `${templateName}.ejs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            
            return ejs.render(templateContent, {
                ...data,
                year: new Date().getFullYear(),
                site_name: 'XOSS Gaming',
                site_url: process.env.SITE_URL || 'https://xossgaming.com',
                support_email: 'support@xossgaming.com'
            });
        } catch (error) {
            console.error(`❌ Error rendering template ${templateName}:`, error);
            throw error;
        }
    }

    /**
     * Send email with template
     */
    async sendEmail(to, subject, templateName, templateData = {}, options = {}) {
        try {
            const html = await this.renderTemplate(templateName, templateData);
            
            const mailOptions = {
                from: options.from || this.config.from,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                ...options
            };

            // Add CC and BCC if provided
            if (options.cc) mailOptions.cc = options.cc;
            if (options.bcc) mailOptions.bcc = options.bcc;

            // Add attachments if provided
            if (options.attachments) mailOptions.attachments = options.attachments;

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(userEmail, userData) {
        const subject = 'Verify Your XOSS Gaming Account';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'verify-email',
            {
                user: userData,
                verification_url: `${process.env.SITE_URL}/verify-email?token=${userData.verification_token}`,
                verification_code: userData.verification_code
            }
        );
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(userEmail, userData) {
        const subject = `Welcome to XOSS Gaming, ${userData.name || userData.username}!`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'welcome',
            {
                user: userData,
                dashboard_url: `${process.env.SITE_URL}/dashboard`,
                tournaments_url: `${process.env.SITE_URL}/tournaments`,
                profile_url: `${process.env.SITE_URL}/profile`
            }
        );
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(userEmail, resetData) {
        const subject = 'Reset Your XOSS Gaming Password';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'password-reset',
            {
                user: resetData,
                reset_url: `${process.env.SITE_URL}/reset-password?token=${resetData.reset_token}`,
                expiry_time: '1 hour'
            }
        );
    }

    /**
     * Send password changed notification
     */
    async sendPasswordChangedEmail(userEmail, userData) {
        const subject = 'Your Password Has Been Changed';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'password-changed',
            {
                user: userData,
                support_url: `${process.env.SITE_URL}/support`,
                timestamp: new Date().toLocaleString()
            }
        );
    }

    /**
     * Send OTP/2FA code
     */
    async sendOTPEmail(userEmail, otpData) {
        const subject = 'Your XOSS Gaming Verification Code';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'otp',
            {
                user: otpData.user,
                otp_code: otpData.code,
                expiry_time: otpData.expiry || '10 minutes',
                purpose: otpData.purpose || 'account verification'
            }
        );
    }

    /**
     * Send tournament registration confirmation
     */
    async sendTournamentRegistrationEmail(userEmail, tournamentData) {
        const subject = `Tournament Registration Confirmed: ${tournamentData.name}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'tournament-registration',
            {
                user: tournamentData.user,
                tournament: tournamentData,
                tournament_url: `${process.env.SITE_URL}/tournaments/${tournamentData.slug || tournamentData.id}`,
                join_instructions: tournamentData.join_instructions || 'Check your dashboard for joining details.'
            }
        );
    }

    /**
     * Send tournament results notification
     */
    async sendTournamentResultsEmail(userEmail, resultsData) {
        const subject = `Tournament Results: ${resultsData.tournament_name}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'tournament-results',
            {
                user: resultsData.user,
                tournament: resultsData,
                position: resultsData.position,
                prize: resultsData.prize,
                results_url: `${process.env.SITE_URL}/tournaments/${resultsData.tournament_slug}/results`
            }
        );
    }

    /**
     * Send deposit confirmation
     */
    async sendDepositConfirmationEmail(userEmail, depositData) {
        const subject = `Deposit Confirmed: ${depositData.amount} ${depositData.currency}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'deposit-confirmation',
            {
                user: depositData.user,
                deposit: depositData,
                transaction_id: depositData.transaction_id,
                balance_url: `${process.env.SITE_URL}/wallet`,
                receipt_url: `${process.env.SITE_URL}/transactions/${depositData.transaction_id}`
            }
        );
    }

    /**
     * Send withdrawal confirmation
     */
    async sendWithdrawalConfirmationEmail(userEmail, withdrawalData) {
        const subject = `Withdrawal Request Received: ${withdrawalData.amount} ${withdrawalData.currency}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'withdrawal-confirmation',
            {
                user: withdrawalData.user,
                withdrawal: withdrawalData,
                transaction_id: withdrawalData.transaction_id,
                processing_time: withdrawalData.processing_time || '24-48 hours',
                status_url: `${process.env.SITE_URL}/transactions/${withdrawalData.transaction_id}`
            }
        );
    }

    /**
     * Send withdrawal completed notification
     */
    async sendWithdrawalCompletedEmail(userEmail, withdrawalData) {
        const subject = `Withdrawal Completed: ${withdrawalData.amount} ${withdrawalData.currency}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'withdrawal-completed',
            {
                user: withdrawalData.user,
                withdrawal: withdrawalData,
                transaction_id: withdrawalData.transaction_id,
                completed_at: withdrawalData.completed_at,
                wallet_url: `${process.env.SITE_URL}/wallet`
            }
        );
    }

    /**
     * Send ticket created confirmation
     */
    async sendTicketCreatedEmail(userEmail, ticketData) {
        const subject = `Support Ticket Created: #${ticketData.ticket_number}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'ticket-created',
            {
                user: ticketData.user,
                ticket: ticketData,
                ticket_url: `${process.env.SITE_URL}/support/tickets/${ticketData.id}`,
                expected_response: 'Within 24 hours'
            }
        );
    }

    /**
     * Send ticket response notification
     */
    async sendTicketResponseEmail(userEmail, ticketData) {
        const subject = `New Response on Ticket #${ticketData.ticket_number}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'ticket-response',
            {
                user: ticketData.user,
                ticket: ticketData,
                ticket_url: `${process.env.SITE_URL}/support/tickets/${ticketData.id}`,
                responder: ticketData.last_responder || 'Support Team'
            }
        );
    }

    /**
     * Send ticket resolved notification
     */
    async sendTicketResolvedEmail(userEmail, ticketData) {
        const subject = `Ticket Resolved: #${ticketData.ticket_number}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'ticket-resolved',
            {
                user: ticketData.user,
                ticket: ticketData,
                ticket_url: `${process.env.SITE_URL}/support/tickets/${ticketData.id}`,
                resolution_notes: ticketData.resolution_notes,
                feedback_url: `${process.env.SITE_URL}/support/feedback/${ticketData.id}`
            }
        );
    }

    /**
     * Send post published notification (for admins)
     */
    async sendPostPublishedEmail(userEmail, postData) {
        const subject = `Post Published: ${postData.title}`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'post-published',
            {
                user: postData.author,
                post: postData,
                post_url: `${process.env.SITE_URL}/posts/${postData.slug}`,
                analytics_url: `${process.env.SITE_URL}/dashboard/posts/${postData.id}/analytics`
            }
        );
    }

    /**
     * Send post pending review notification (to admins)
     */
    async sendPostPendingReviewEmail(adminEmails, postData) {
        const subject = `Post Pending Review: ${postData.title}`;
        
        return await this.sendEmail(
            adminEmails,
            subject,
            'post-pending-review',
            {
                post: postData,
                author: postData.author,
                review_url: `${process.env.ADMIN_URL}/posts/${postData.id}/review`,
                admin_dashboard_url: `${process.env.ADMIN_URL}/dashboard`
            },
            { bcc: adminEmails }
        );
    }

    /**
     * Send featured post notification
     */
    async sendFeaturedPostEmail(userEmail, postData) {
        const subject = `🎉 Congratulations! Your Post is Now Featured on XOSS Gaming`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'featured-post',
            {
                user: postData.author,
                post: postData,
                post_url: `${process.env.SITE_URL}/posts/${postData.slug}`,
                featured_until: postData.featured_until,
                featured_url: `${process.env.SITE_URL}/featured`
            }
        );
    }

    /**
     * Send account security alert
     */
    async sendSecurityAlertEmail(userEmail, securityData) {
        const subject = 'Security Alert: Suspicious Activity Detected';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'security-alert',
            {
                user: securityData.user,
                activity: securityData.activity,
                location: securityData.location,
                device: securityData.device,
                timestamp: securityData.timestamp,
                secure_url: `${process.env.SITE_URL}/security`,
                change_password_url: `${process.env.SITE_URL}/change-password`
            }
        );
    }

    /**
     * Send account banned/restricted notification
     */
    async sendAccountRestrictedEmail(userEmail, restrictionData) {
        const subject = 'Account Status Update';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'account-restricted',
            {
                user: restrictionData.user,
                restriction_type: restrictionData.type,
                reason: restrictionData.reason,
                duration: restrictionData.duration,
                appeal_url: `${process.env.SITE_URL}/appeal`,
                support_url: `${process.env.SITE_URL}/support`
            }
        );
    }

    /**
     * Send newsletter subscription confirmation
     */
    async sendNewsletterConfirmationEmail(userEmail, subscriptionData) {
        const subject = 'Welcome to XOSS Gaming Newsletter';
        
        return await this.sendEmail(
            userEmail,
            subject,
            'newsletter-confirmation',
            {
                user: subscriptionData,
                preferences_url: `${process.env.SITE_URL}/newsletter/preferences`,
                unsubscribe_url: `${process.env.SITE_URL}/unsubscribe?token=${subscriptionData.unsubscribe_token}`
            }
        );
    }

    /**
     * Send referral program invitation
     */
    async sendReferralEmail(userEmail, referralData) {
        const subject = `${referralData.referrer_name} invited you to join XOSS Gaming`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'referral-invitation',
            {
                referrer: referralData.referrer,
                referral_link: `${process.env.SITE_URL}/register?ref=${referralData.referral_code}`,
                bonus_amount: referralData.bonus_amount,
                terms_url: `${process.env.SITE_URL}/referral-terms`
            }
        );
    }

    /**
     * Send referral reward notification
     */
    async sendReferralRewardEmail(userEmail, rewardData) {
        const subject = `🎁 You earned ${rewardData.reward_amount} for referring a friend!`;
        
        return await this.sendEmail(
            userEmail,
            subject,
            'referral-reward',
            {
                user: rewardData.user,
                referral: rewardData.referral,
                reward_amount: rewardData.reward_amount,
                wallet_balance: rewardData.wallet_balance,
                wallet_url: `${process.env.SITE_URL}/wallet`,
                invite_more_url: `${process.env.SITE_URL}/referral`
            }
        );
    }

    /**
     * Send custom transactional email
     */
    async sendCustomEmail(to, subject, templateData, templateName = 'custom') {
        return await this.sendEmail(
            to,
            subject,
            templateName,
            templateData
        );
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(recipients, subject, templateName, templateData, options = {}) {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendEmail(
                    recipient.email,
                    subject,
                    templateName,
                    { ...templateData, user: recipient },
                    options
                );
                results.push({ recipient, success: true, result });
            } catch (error) {
                results.push({ recipient, success: false, error: error.message });
            }
        }
        
        return {
            total: recipients.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        };
    }

    /**
     * Get email sending statistics
     */
    async getStatistics() {
        // This would typically connect to a database or analytics service
        // For now, return mock stats
        return {
            total_sent: 0,
            successful: 0,
            failed: 0,
            last_sent: null
        };
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
