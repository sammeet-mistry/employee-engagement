import axios from 'axios';

const apiClient = axios.create({
  baseURL: '',
});

apiClient.interceptors.request.use(
  async (config) => {
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const { data } = await apiClient.get('/api/auth/csrf');
      config.headers['X-CSRF-Token'] = data.csrfToken;
    }
    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isSessionBootstrap = requestUrl.endsWith('/auth/profile');
    if (error.response?.status === 401 && !isSessionBootstrap) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;