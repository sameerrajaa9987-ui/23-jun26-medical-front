import { apiClient } from "@api/apiClient";
import {
  AuthResponse,
  MessageResponse,
  LoginPayload,
  SignupPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@modules/auth/types";

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/auth/login", payload);
    return res.data;
  },
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>("/auth/signup", payload);
    return res.data;
  },
  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<MessageResponse> => {
    const res = await apiClient.post("/auth/forgot-password", payload);
    return res.data;
  },
  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<MessageResponse> => {
    const res = await apiClient.post("/auth/reset-password", payload);
    return res.data;
  },
  logout: async (refreshToken: string): Promise<MessageResponse> => {
    const res = await apiClient.post("/auth/logout", { refreshToken });
    return res.data;
  },
};
