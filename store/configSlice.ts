import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UploadConfig {
  maxSizeMb: number;
  maxFiles: number;
  mimeTypes: string[];
}

interface AppConfig {
  upload: {
    contrat: UploadConfig;
    preuve: UploadConfig;
  };
}

interface ConfigState {
  config: AppConfig | null;
  loaded: boolean;
  /** Renseigné si GET /config a définitivement échoué (après les tentatives). */
  error: string | null;
}

// Non persisté (voir whitelist dans store/index.ts) : rechargé à chaque démarrage
// pour que les limites suivent immédiatement un changement côté backend.
const initialState: ConfigState = {
  config: null,
  loaded: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig(state, action: PayloadAction<AppConfig>) {
      state.config = action.payload;
      state.loaded = true;
      state.error = null;
    },
    setConfigError(state, action: PayloadAction<string>) {
      state.config = null;
      state.loaded = false;
      state.error = action.payload;
    },
  },
});

export const { setConfig, setConfigError } = configSlice.actions;
export default configSlice.reducer;
