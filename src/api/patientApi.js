const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const createPatientApi = async (patient) => {
  const response = await fetch(`${API_BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const updatePatientApi = async (id, patient) => {
  const response = await fetch(`${API_BASE}/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });

  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }

  return response.json();
};

export const deletePatientApi = async (id) => {
  const response = await fetch(`${API_BASE}/patients/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }

  return response.json();
};
