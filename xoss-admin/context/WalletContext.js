//context/WalletContext.js - FIXED VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ CORRECT API URL - আপনার actual backend URL দিয়ে replace করুন
  const API_URL = 'http://192.168.0.100:5000/api/wallet'; // ✅ Local server
  // const API_URL = 'https://your-actual-backend.onrender.com/api/wallet'; // ✅ Production

  const fetchWallet = async () => {
    if (!user?.userId) {
      console.log('❌ No user ID found');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🔍 Fetching wallet for user: ${user.userId}`);
      const res = await axios.get(`${API_URL}/balance`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (res.data.success) {
        setBalance(res.data.balance);
        console.log(`✅ Wallet balance: ${res.data.balance}`);
      } else {
        console.error('❌ Wallet fetch failed:', res.data.message);
      }
    } catch (err) {
      console.error('❌ Wallet fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async (amount) => {
    try {
      const res = await axios.post(`${API_URL}/credit`, {
        userId: user.userId, // ✅ userId, not _id
        amount,
      }, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (res.data.success) {
        setBalance(res.data.new_balance);
        return { success: true, balance: res.data.new_balance };
      } else {
        return { success: false, error: res.data.message };
      }
    } catch (err) {
      console.error('Add funds error:', err.message);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchWallet();
    }
  }, [user]);

  return (
    <WalletContext.Provider
      value={{ 
        balance, 
        addFunds, 
        fetchWallet, 
        loading 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
