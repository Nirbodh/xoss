// utils/notifications.js - নতুন ফাইল তৈরি করুন
class NotificationService {
  static async sendPrizeNotification(userId, amount, eventTitle) {
    // TODO: Implement push notification
    console.log(`🎉 Prize notification: User ${userId} won ${amount} from ${eventTitle}`);
  }
  
  static async sendWithdrawalNotification(userId, amount, status) {
    // TODO: Implement push notification  
    console.log(`💰 Withdrawal ${status}: User ${userId} - Amount ${amount}`);
  }
}

module.exports = NotificationService;
