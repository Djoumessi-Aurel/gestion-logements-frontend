'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PrimeReactProvider } from 'primereact/api';
import { store, persistor } from './index';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // useRef évite de recréer le store à chaque rendu
  const storeRef = useRef(store);
  const persistorRef = useRef(persistor);

  return (
    <PrimeReactProvider>
      <Provider store={storeRef.current}>
        <PersistGate loading={null} persistor={persistorRef.current}>
          {children}
        </PersistGate>
      </Provider>
    </PrimeReactProvider>
  );
}
