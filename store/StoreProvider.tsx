'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PrimeReactProvider } from 'primereact/api';
import { store, persistor } from './index';

/**
 * `store` et `persistor` sont des singletons créés à l'évaluation du module
 * store/index.ts, donc déjà stables d'un rendu à l'autre : les envelopper dans
 * un useRef n'apportait rien et enfreignait react-hooks/refs, qui interdit de
 * lire `.current` pendant le rendu.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrimeReactProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {children}
        </PersistGate>
      </Provider>
    </PrimeReactProvider>
  );
}
