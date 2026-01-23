// context/EventContext.js - SEPARATE ENDPOINTS VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  // ✅ ALADDA API CALLS
  const fetchAllEvents = async () => {
    try {
      console.log('🔄 Loading events from separate endpoints...');
      setLoading(true);
      setError(null);

      // ✅ 1. ম্যাচগুলো লোড করো
      console.log('⚡ Fetching matches...');
      const matchesResponse = await fetch('https://xoss.onrender.com/api/matches');
      
      if (!matchesResponse.ok) {
        throw new Error(`Matches API error: ${matchesResponse.status}`);
      }
      
      const matchesData = await matchesResponse.json();
      console.log(`✅ Loaded ${matchesData.data?.length || 0} matches`);

      // ✅ 2. টুর্নামেন্টগুলো লোড করো
      console.log('🏆 Fetching tournaments...');
      const tournamentsResponse = await fetch('https://xoss.onrender.com/api/tournaments');
      
      if (!tournamentsResponse.ok) {
        throw new Error(`Tournaments API error: ${tournamentsResponse.status}`);
      }
      
      const tournamentsData = await tournamentsResponse.json();
      console.log(`✅ Loaded ${tournamentsData.data?.length || 0} tournaments`);

      // ✅ 3. সব ডাটা একত্রিত করো
      const allMatches = matchesData.data || [];
      const allTournaments = tournamentsData.data || [];

      // ম্যাচগুলোর জন্য matchType সেট করো
      const formattedMatches = allMatches.map(match => ({
        ...match,
        matchType: 'match',
        _id: match._id || match.id || `match-${Date.now()}`,
        id: match._id || match.id || `match-${Date.now()}`
      }));

      // টুর্নামেন্টগুলোর জন্য matchType সেট করো
      const formattedTournaments = allTournaments.map(tournament => ({
        ...tournament,
        matchType: 'tournament',
        _id: tournament._id || tournament.id || `tournament-${Date.now()}`,
        id: tournament._id || tournament.id || `tournament-${Date.now()}`
      }));

      // সব events একত্রিত করো
      const allEvents = [...formattedMatches, ...formattedTournaments];
      
      console.log(`✅ Total events: ${allEvents.length} (${formattedMatches.length} matches + ${formattedTournaments.length} tournaments)`);

      setMatches(formattedMatches);
      setTournaments(formattedTournaments);
      setEvents(allEvents);
      
    } catch (err) {
      console.log('❌ Error loading events:', err.message);
      setError('Cannot load events. Please try again.');
      
      // Emergency fallback - empty arrays
      setMatches([]);
      setTournaments([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllEvents();
  }, []);

  return (
    <EventContext.Provider
      value={{
        // All combined
        events,
        loading,
        error,
        
        // Separate
        matches,
        tournaments,
        
        // Helper function
        fetchAllEvents
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEvents must be used within EventProvider');
  return context;
};
