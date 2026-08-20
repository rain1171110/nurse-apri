import { throwApiError } from "./apiError";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

type LoginData = {
  email: string;
  password: string;
};

export const loginApi = async (receiveLogin: LoginData): Promise<void> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(receiveLogin),
    credentials: "include",
  });

  if (!response.ok) {
    await throwApiError(response);
  }
};
