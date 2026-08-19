import type { AppData } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const fetchAppData = async (): Promise<AppData> => {
  const response = await fetch(`${API_BASE}/data`, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }

  const data: AppData = await response.json();
  return data;
};
