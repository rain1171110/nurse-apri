const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const fetchAppData = async () => {
  const response = await fetch(`${API_BASE}/data`);
  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }
  return response.json();
};
