import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store';
import { setCredentials, clearCredentials } from '@/store/authSlice';
import { Role } from '@/types/enums';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // nécessaire pour envoyer le cookie HttpOnly refresh_token
});

// ─── Intercepteur request : injecter le Bearer token ─────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Gestion des requêtes concurrentes en attente de refresh ──────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Intercepteur response : refresh auto sur 401 ────────────────────────────

type InternalRequestWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };

interface RefreshResponseData {
  data: {
    access_token: string;
    user: { id: number; username: string; role: string };
  };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalRequestWithRetry | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // ⚠️ Éviter la boucle infinie : si la requête échouée est déjà /auth/refresh
    // on ne tente pas un nouveau refresh — on déconnecte directement.
    if (originalRequest.url?.includes('/auth/refresh')) {
      store.dispatch(clearCredentials());
      redirectToLogin();
      return Promise.reject(error);
    }

    // Si un refresh est déjà en cours, mettre la requête en file d'attente
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Première requête 401 : tenter le refresh
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post<RefreshResponseData>('/auth/refresh');
      const { access_token, user } = data.data;

      store.dispatch(
        setCredentials({
          accessToken: access_token,
          user: { id: user.id, username: user.username, role: user.role as Role },
        }),
      );

      processQueue(null, access_token);
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      store.dispatch(clearCredentials());
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export default apiClient;
