// xoss-admin/context/WalletContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://your-backend-url.onrender.com/api/wallet'; // তোমার Render বা localhost লিঙ্ক বসাও

  const fetchWallet = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${user._id}`);
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Wallet fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async (amount) => {
    try {
      const res = await axios.post(`${API_URL}/add`, {
        userId: user._id,
        amount,
      });
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Add funds error:', err.message);
    }
  };

  const deductFunds = async (amount) => {
    try {
      const res = await axios.post(`${API_URL}/deduct`, {
        userId: user._id,
        amount,
      });
      setBalance(res.data.balance);
    } catch (err) {
      console.error('Deduct funds error:', err.message);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  return (
    <WalletContext.Provider
      value={{ balance, addFunds, deductFunds, fetchWallet, loading }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
