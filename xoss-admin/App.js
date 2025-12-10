// App.js - FINAL
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { MatchProvider } from './context/MatchContext';
import { WalletProvider } from './context/WalletContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <TournamentProvider>
          <MatchProvider>
            <AppNavigator />
          </MatchProvider>
        </TournamentProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
