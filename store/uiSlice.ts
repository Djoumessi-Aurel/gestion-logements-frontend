import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  /** true quand le refresh token est expiré — le layout dashboard affiche le toast + redirige */
  sessionExpired: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  sessionExpired: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setSessionExpired(state, action: PayloadAction<boolean>) {
      state.sessionExpired = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setSessionExpired } = uiSlice.actions;
export default uiSlice.reducer;
