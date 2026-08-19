import type { NursingRecord } from "../types";
import { throwApiError } from "./apiError";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const createRecordApi = async (
  record: Omit<NursingRecord, "id">,
): Promise<NursingRecord> => {
  const response = await fetch(`${API_BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    credentials: "include",
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  const data: NursingRecord = await response.json();
  return data;
};

export const updateRecordApi = async (
  id: string,
  record: Omit<NursingRecord, "id">,
): Promise<NursingRecord> => {
  const response = await fetch(`${API_BASE}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
    credentials: "include",
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  const data: NursingRecord = await response.json();
  return data;
};

export const deleteRecordApi = async (id: string): Promise<{ id: string }> => {
  const response = await fetch(`${API_BASE}/records/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  const data: { id: string } = await response.json();
  return data;
};
