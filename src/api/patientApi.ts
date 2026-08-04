import type { Patient } from "../types";
import { throwApiError } from "./apiError";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const createPatientApi = async (
  patient: Omit<Patient, "id">,
): Promise<Patient> => {
  const response = await fetch(`${API_BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  const data: Patient = await response.json();
  return data;
};

export const updatePatientApi = async (
  id: string,
  patient: Omit<Patient, "id">,
): Promise<Patient> => {
  const response = await fetch(`${API_BASE}/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    await throwApiError(response);
  }
  const data: Patient = await response.json();
  return data;
};

export const deletePatientApi = async (id: string): Promise<{ id: string }> => {
  const response = await fetch(`${API_BASE}/patients/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const data: { id: string } = await response.json();
  return data;
};
