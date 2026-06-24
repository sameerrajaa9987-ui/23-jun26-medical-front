const ENV = {
  development: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL_DEV || "http://localhost:5002/api/v1",
    socketUrl:
      process.env.EXPO_PUBLIC_SOCKET_URL_DEV || "http://localhost:5002",
  },
  production: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL || "https://api.medstock.app/api/v1",
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || "https://api.medstock.app",
  },
};

const getEnv = () => (__DEV__ ? ENV.development : ENV.production);

export const environment = getEnv();
