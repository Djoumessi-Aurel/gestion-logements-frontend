import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  type PersistConfig,
} from 'redux-persist';
import CryptoJS from 'crypto-js';

import authReducer from './authSlice';
import uiReducer from './uiSlice';
import configReducer from './configSlice';

// SSR-safe storage : noopStorage côté serveur, localStorage côté client
function createNoopStorage() {
  return {
    getItem: (_key: string) => Promise.resolve<string | null>(null),
    setItem: (_key: string, value: string) => Promise.resolve(value),
    removeItem: (_key: string) => Promise.resolve(),
  };
}

const storage =
  typeof window !== 'undefined'
    ? (require('redux-persist/lib/storage') as { default: typeof import('redux-persist/lib/storage').default }).default
    : createNoopStorage();

// Transform de chiffrement CryptoJS pour le slice auth
const secret = process.env.NEXT_PUBLIC_CRYPTO_SECRET ?? 'fallback-dev-secret';

const encryptTransform = createTransform(
  // Chiffrement avant écriture dans le storage
  (inboundState: unknown) => {
    return CryptoJS.AES.encrypt(JSON.stringify(inboundState), secret).toString();
  },
  // Déchiffrement à la lecture
  (outboundState: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(outboundState, secret);
      const decoded = bytes.toString(CryptoJS.enc.Utf8);
      if (!decoded) return null;
      return JSON.parse(decoded) as unknown;
    } catch {
      return null;
    }
  },
);

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  config: configReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // config non persisté : rechargé à chaque démarrage
  transforms: [encryptTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = RootReducerState;
export type AppDispatch = typeof store.dispatch;
