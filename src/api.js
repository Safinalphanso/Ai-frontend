const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  health: () => request("/"),
  courses: () => request("/courses"),
  addCourse: (name) => request("/courses", { method: "POST", body: JSON.stringify({ name }) }),
  addCourses: (names) => request("/courses", { method: "POST", body: JSON.stringify({ names }) }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: "DELETE" }),
  ingest: (body) => request("/ingest", { method: "POST", body: JSON.stringify(body) }),
  listTasks: () => request("/tasks"),
  dueThisWeek: () => request("/tasks/due-this-week"),
  needsConfirmation: () => request("/tasks/needs-confirmation"),
  history: (id) => request(`/tasks/${id}/history`),
  reset: () => request("/reset", { method: "POST", body: "{}" }),
};

export { API_URL };
