import axios from "axios";
 
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
 
// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("p2p_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
 
// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPath = error.config?.url?.includes("/auth/login") ||
                       error.config?.url?.includes("/auth/change-password");
 
    // Only auto-redirect to login if it's a 401 and NOT an auth-related request
    // This allows the Login/Reset page to show the actual error message (e.g. "Wrong password")
    if (error.response?.status === 401 && !isAuthPath) {
      localStorage.removeItem("p2p_token");
      localStorage.removeItem("p2p_user");
     
      // Dispatch event for AuthContext to update React state without a full reload
      window.dispatchEvent(new Event("auth_unauthorized"));
     
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
 
 
export default api;
 
