import axios from 'axios';

// ─── Single API Gateway entry point ────────────────────────────────────────
// All requests go through the Ocelot gateway on port 5200,
// which then forwards them to the correct microservice.
const GATEWAY = 'http://localhost:5200/gateway';

export const apiProfile = axios.create({ baseURL: `${GATEWAY}/profiles` });
export const apiProduct = axios.create({ baseURL: `${GATEWAY}/products` });
export const apiCart    = axios.create({ baseURL: `${GATEWAY}/carts` });
export const apiOrder   = axios.create({ baseURL: `${GATEWAY}/orders` });
export const apiWallet  = axios.create({ baseURL: `${GATEWAY}/wallet` });

// Add request interceptor to append JWT token to every request
const authInterceptor = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Apply interceptor to all APIs
[apiProfile, apiProduct, apiCart, apiOrder, apiWallet].forEach(api => {
  api.interceptors.request.use(authInterceptor, error => Promise.reject(error));
});
