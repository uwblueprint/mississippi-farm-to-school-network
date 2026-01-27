import axios, { AxiosRequestConfig } from "axios";

const baseAPIClient = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});

baseAPIClient.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const newConfig = { ...config };

  return newConfig;
});

export default baseAPIClient;
