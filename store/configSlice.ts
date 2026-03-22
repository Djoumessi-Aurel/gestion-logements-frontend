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
}

const initialState: ConfigState = {
  config: null,
  loaded: false,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig(state, action: PayloadAction<AppConfig>) {
      state.config = action.payload;
      state.loaded = true;
    },
  },
});

export const { setConfig } = configSlice.actions;
export default configSlice.reducer;
