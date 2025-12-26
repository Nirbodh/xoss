// services/autoWithdrawal.js - AUTO WITHDRAWAL SERVICE (FOR FUTURE)
/*
🔹 এই ফাইলটি ভবিষ্যতে যখন আপনি bKash/Nagad/Rocket API পাবেন তখন ব্যবহার করবেন।
🔹 এখনই ব্যবহার করবেন না, শুধু ফাইলটি তৈরি করে রাখুন।

ইন্সট্রাকশন:
1. যখন আপনার payment gateway (bKash/Nagad) API পাবেন
2. এই ফাইলে আসল API কল যোগ করবেন
3. withdrawalController.js ফাইলের commented কোড uncomment করবেন
4. withdrawal model এ auto withdrawal ফিল্ড uncomment করবেন
*/

const Withdrawal = require('../models/withdrawal');
const { Wallet, Transaction } = require('../models/Wallet');

class AutoWithdrawalService {
  constructor() {
    this.autoEnabled = false;
    this.maxRetries = 3;
    this.retryDelay = 30 * 60 * 1000; // 30 minutes
  }

  // Enable/disable auto withdrawal system
  setAutoEnabled(enabled) {
    this.autoEnabled = enabled;
    console.log(`⚙️ Auto withdrawal system ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  // Process pending auto withdrawals
  async processPendingWithdrawals() {
    if (!this.autoEnabled) {
      return {
        success: false,
        processed: 0,
        message: 'Auto withdrawal system is disabled'
      };
    }

    try {
      console.log('🔄 Processing auto withdrawals...');
      
      // Find pending auto withdrawals (last 24 hours, max 10 at a time)
      const pendingWithdrawals = await Withdrawal.find({
        withdrawal_type: 'auto',
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .populate('user_id')
      .limit(10);

      let processed = 0;
      let failed = 0;
      const results = [];

      for (const withdrawal of pendingWithdrawals) {
        try {
          const result = await this.processSingleWithdrawal(withdrawal);
          results.push({
            withdrawalId: withdrawal._id,
            userId: withdrawal.user_id._id,
            amount: withdrawal.amount,
            status: result.success ? 'success' : 'failed',
            message: result.message
          });

          if (result.success) {
            processed++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`❌ Error processing withdrawal ${withdrawal._id}:`, error);
          failed++;
          results.push({
            withdrawalId: withdrawal._id,
            status: 'error',
            message: error.message
          });
        }
      }

      return {
        success: true,
        processed,
        failed,
        total: pendingWithdrawals.length,
        results
      };

    } catch (error) {
      console.error('❌ Auto withdrawal processing error:', error);
      return {
        success: false,
        processed: 0,
        failed: 0,
        error: error.message
      };
    }
  }

  // Process single withdrawal
  async processSingleWithdrawal(withdrawal) {
    try {
      console.log(`💰 Processing auto withdrawal: ${withdrawal._id}, Amount: ${withdrawal.amount} to ${withdrawal.account_details.phone}`);
      
      // 🔹 STEP 1: Call payment gateway API
      const paymentResult = await this.callPaymentGateway(withdrawal);
      
      if (!paymentResult.success) {
        throw new Error(`Payment gateway error: ${paymentResult.message}`);
      }

      // 🔹 STEP 2: Update withdrawal status
      withdrawal.status = 'completed';
      withdrawal.auto_processed = true;
      withdrawal.api_reference_id = paymentResult.transactionId;
      withdrawal.api_response = paymentResult;
      withdrawal.processed_at = new Date();
      withdrawal.completed_at = new Date();
      
      await withdrawal.save();

      // 🔹 STEP 3: Update transaction status
      await Transaction.findOneAndUpdate(
        { 'metadata.withdrawalId': withdrawal._id },
        {
          status: 'completed',
          description: `Auto withdrawal to ${withdrawal.payment_method}`,
          'metadata.auto_processed': true,
          'metadata.gateway_transaction_id': paymentResult.transactionId
        }
      );

      // 🔹 STEP 4: Update wallet total withdrawn
      const wallet = await Wallet.findOne({ user_id: withdrawal.user_id });
      if (wallet) {
        wallet.total_withdrawn += withdrawal.amount;
        await wallet.save();
      }

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        message: 'Auto withdrawal completed successfully'
      };

    } catch (error) {
      console.error(`❌ Auto withdrawal failed for ${withdrawal._id}:`, error);
      
      // Update withdrawal as failed
      withdrawal.status = 'failed';
      withdrawal.admin_notes = `Auto processing failed: ${error.message}`;
      withdrawal.retry_count = (withdrawal.retry_count || 0) + 1;
      
      if (withdrawal.retry_count < this.maxRetries) {
        withdrawal.next_retry_at = new Date(Date.now() + this.retryDelay);
        withdrawal.status = 'pending'; // Retry later
      }
      
      await withdrawal.save();
      
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 🔹 PAYMENT GATEWAY INTEGRATION
  async callPaymentGateway(withdrawal) {
    const { payment_method, account_details, amount } = withdrawal;
    
    console.log(`🌐 Calling ${payment_method.toUpperCase()} API...`);
    
    // 🔹 TEMPLATE FOR ACTUAL IMPLEMENTATION
    // যখন আপনার payment gateway API পাবেন, এই ফাংশনটি replace করবেন
    
    /*
    // Example for bKash API:
    if (payment_method === 'bkash') {
      const bKashResponse = await axios.post('https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/payment/create', {
        amount: amount.toString(),
        receiverMSISDN: account_details.phone,
        currency: 'BDT',
        merchantInvoiceNumber: `WD${withdrawal._id}`
      }, {
        headers: {
          'Authorization': `Bearer YOUR_BKASH_TOKEN`,
          'X-APP-Key': 'YOUR_APP_KEY',
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: bKashResponse.data.statusCode === '0000',
        transactionId: bKashResponse.data.paymentID,
        message: bKashResponse.data.statusMessage,
        rawResponse: bKashResponse.data
      };
    }
    
    // Example for Nagad API:
    if (payment_method === 'nagad') {
      const nagadResponse = await axios.post('https://api.mynagad.com/api/dfs/check-out/initialize/{{MERCHANT_ID}}/{{ORDER_ID}}', {
        accountNumber: account_details.phone,
        amount: amount.toString(),
        dateTime: new Date().toISOString(),
        additionalMerchantInfo: {
          withdrawalId: withdrawal._id.toString()
        }
      }, {
        headers: {
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': 'YOUR_SERVER_IP',
          'X-KM-Client-Type': 'MOBILE_APP'
        }
      });
      
      return {
        success: nagadResponse.data.reason === 'Success',
        transactionId: nagadResponse.data.paymentRefId,
        message: nagadResponse.data.reason,
        rawResponse: nagadResponse.data
      };
    }
    */
    
    // 🔹 TEMPORARY MOCK RESPONSE (Remove when implementing actual API)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful response
    return {
      success: true,
      transactionId: `GATEWAY_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      message: 'Payment processed successfully',
      amount: amount,
      recipient: account_details.phone,
      method: payment_method,
      timestamp: new Date().toISOString()
    };
  }

  // Check if user is eligible for auto withdrawal
  async checkEligibility(userId, amount) {
    const wallet = await Wallet.findOne({ user_id: userId });
    
    if (!wallet) {
      return { eligible: false, reason: 'Wallet not found' };
    }
    
    if (!wallet.settings.auto_withdraw) {
      return { eligible: false, reason: 'Auto withdrawal not enabled in settings' };
    }
    
    if (amount < 100) {
      return { eligible: false, reason: 'Minimum auto withdrawal amount is ৳100' };
    }
    
    if (amount > 10000) {
      return { eligible: false, reason: 'Maximum auto withdrawal amount is ৳10,000' };
    }
    
    if (amount > wallet.balance) {
      return { eligible: false, reason: 'Insufficient balance' };
    }
    
    // Check daily limit (max 3 auto withdrawals per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await Withdrawal.countDocuments({
      user_id: userId,
      withdrawal_type: 'auto',
      createdAt: { $gte: today }
    });
    
    if (todayWithdrawals >= 3) {
      return { eligible: false, reason: 'Daily auto withdrawal limit reached (3 per day)' };
    }
    
    return { eligible: true };
  }

  // Get system status
  getStatus() {
    return {
      auto_enabled: this.autoEnabled,
      max_retries: this.maxRetries,
      retry_delay_minutes: this.retryDelay / (60 * 1000),
      features: ['auto_processing', 'retry_mechanism', 'eligibility_check']
    };
  }
}

// Export singleton instance
module.exports = new AutoWithdrawalService();
