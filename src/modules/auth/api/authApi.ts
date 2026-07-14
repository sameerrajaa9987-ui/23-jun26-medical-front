import { apiClient } from "@api/apiClient";
import { getDeviceId, getDeviceName } from "@api/deviceId";
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
    const deviceId = await getDeviceId();
    const res = await apiClient.post<AuthResponse>("/auth/login", {
      ...payload,
      deviceId,
      deviceName: getDeviceName(),
    });
    return res.data;
  },
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const deviceId = await getDeviceId();
    const res = await apiClient.post<AuthResponse>("/auth/signup", {
      ...payload,
      deviceId,
      deviceName: getDeviceName(),
    });
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
