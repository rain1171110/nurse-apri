const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001/api";

export const fetchAppData = async () => {
  const response = await fetch(`${API_BASE}/data`);
  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }
  return response.json();
};

export const saveAppData = async (payload) => {
  const response = await fetch(`${API_BASE}/data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }
  return response.json();
};

export const updatePatientApi = async (id, patient) => {
  console.log("api.js updatePatientApi が呼ばれた");
  console.log("id:", id);
  console.log("patient:", patient);

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

export const createRecordApi = async (record) => {
  const response = await fetch(`${API_BASE}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const updateRecordApi = async (id, record) => {
  const response = await fetch(`${API_BASE}/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
};

export const deleteRecordApi = async (id) => {
  const response = await fetch(`${API_BASE}/records/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`API error:${response.status}`);
  }

  return response.json();
};
