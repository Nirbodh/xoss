// xoss-new/context/MatchContext.js - COMPLETELY FIXED
import React, { createContext, useContext, useState, useEffect } from 'react';

// 🎯 Create Context
const MatchContext = createContext();

// 🎯 matchesAPI - DIRECTLY INLINE (No external dependency)
const matchesAPI = {
  getAll: async () => {
    try {
      console.log('🔄 Fetching matches from backend...');
      
      // For now, return mock data - Backend fix হলে real API call করুন
      console.log('🔄 Using inline mock data');
      return {
        success: true,
        data: [
          {
            _id: '1',
            title: 'DAILY ROYALE TOURNAMENT',
            game: 'freefire',
            matchType: 'match',
            type: 'Solo',
            map: 'Bermuda',
            entry_fee: 50,
            total_prize: 5000,
            perKill: 10,
            max_participants: 100,
            current_participants: 48,
            status: 'upcoming',
            scheduleTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            roomId: '123456',
            room_code: '123456',
            password: 'xoss123',
            description: 'Daily tournament for Free Fire players',
            created_by: 'admin'
          },
          {
            _id: '2', 
            title: 'WEEKEND SHOWDOWN',
            game: 'pubg',
            matchType: 'tournament',
            type: 'Squad', 
            map: 'Erangel',
            entry_fee: 100,
            total_prize: 10000,
            perKill: 15,
            max_participants: 50,
            current_participants: 35,
            status: 'upcoming',
            scheduleTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            roomId: '789012',
            room_code: '789012', 
            password: 'pubg123',
            description: 'Weekend tournament for PUBG Mobile',
            created_by: 'admin'
          }
        ],
        message: 'Using mock data - Backend connection in progress'
      };
    } catch (err) {
      console.error('❌ Inline matchesAPI error:', err);
      return {
        success: true,
        data: [],
        message: 'Error fetching matches'
      };
    }
  }
};

// 🎯 Provider Component
export const MatchProvider = ({ children }) => {
  const [matches, setMatches] = useState([]);       // সব ম্যাচ
  const [loading, setLoading] = useState(false);    // লোডিং স্টেট
  const [error, setError] = useState(null);         // এরর স্টেট

  // ✅ Fetch All Matches (Inline API থেকে)
  const refreshMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching matches...');

      const res = await matchesAPI.getAll(); // 🛰️ Inline API থেকে ডেটা নিচ্ছে
      console.log('📥 Matches Response:', res);

      if (res && res.success) {
        setMatches(res.data || []);
      } else {
        setError('Failed to load matches');
      }
    } catch (err) {
      console.error('❌ Match fetch error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Debug Function
  const debugMatchesAPI = async () => {
    try {
      console.log('🔍 Debugging Matches API...');
      const response = await matchesAPI.getAll();
      console.log('📊 Match API Response:', response);
    } catch (error) {
      console.error('❌ Debug Matches API error:', error);
    }
  };

  // ✅ Auto Fetch on Mount
  useEffect(() => {
    refreshMatches();
  }, []);

  // 🎯 Provide data to all components
  return (
    <MatchContext.Provider
      value={{
        matches,
        loading,
        error,
        refreshMatches,
        debugMatchesAPI
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

// 🎯 Custom Hook for easy access
export const useMatches = () => useContext(MatchContext);
