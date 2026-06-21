
import axios from 'axios'


const client = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 5000,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = await client.post('/auth/refresh');
      const newToken = refresh.data.accessToken;

      localStorage.setItem('accessToken', newToken);

      error.config.headers.Authorization = `Bearer ${newToken}`;
      return client(error.config);
    }

    return Promise.reject(error);
  }
);

export default client;
