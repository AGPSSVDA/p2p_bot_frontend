import api from "@/lib/axios";

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      role: string;
    };
  };
}

export interface CommonResponse {
  success: boolean;
  message: string;
  data: null;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", { email, password });
    return response.data;
  },
  
  logout: async (): Promise<CommonResponse> => {
    const response = await api.post<CommonResponse>("/auth/logout");
    return response.data;
  },
  
  changePassword: async (oldPassword: string, newPassword: string): Promise<CommonResponse> => {
    const response = await api.post<CommonResponse>("/auth/change-password", { 
      oldPassword, 
      newPassword 
    });
    return response.data;
  }
};
