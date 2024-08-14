// App.tsx
import './polyfills/polyfill.crypto';
import * as React from 'react';
import Navigation from './src/Navigation';
import {WalletProvider} from './src/contexts/WalletContext';
import 'text-encoding-polyfill';

const App: React.FC = () => {
  return (
    <WalletProvider>
      <Navigation />
    </WalletProvider>
  );
};

export default App;
