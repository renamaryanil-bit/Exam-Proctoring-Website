// ─── Central API service layer ────────────────────────────────────────────────
// All fetch calls go through here. Token is read from localStorage automatically.

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('proctorosToken');
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const del  = (path)        => request('DELETE', path);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (username, password, role) => post('/auth/login',    { username, password, role }),
  register: (username, password, role, name) => post('/auth/register', { username, password, role, name }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:            ()                                          => get('/users'),
  getByRole:         (role)                                     => get(`/users/by-role/${role}`),
  getMe:             ()                                         => get('/users/me'),
  updateMe:          (name)                                     => put('/users/me', { name }),
  updateCredentials: (currentPassword, newUsername, newPassword) => put('/users/me/credentials', { currentPassword, newUsername, newPassword }),
  create:            (data)                                     => post('/users', data),
  delete:            (id)                                       => del(`/users/${id}`),
};

// ─── Classes ──────────────────────────────────────────────────────────────────
export const classAPI = {
  getAll:         ()           => get('/classes'),
  create:         (data)       => post('/classes', data),
  delete:         (id)         => del(`/classes/${id}`),
  manageStudents: (id, action, studentIds) => put(`/classes/${id}/students`, { action, studentIds }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
export const testAPI = {
  create:       (data) => post('/tests', data),
  getMyTests:   ()     => get('/tests/my-tests'),
  getAvailable: ()     => get('/tests/available'),
  getAll:       ()     => get('/tests/all'),
  getById:      (id)   => get(`/tests/${id}`),
  delete:       (id)   => del(`/tests/${id}`),
};

// ─── Submissions ──────────────────────────────────────────────────────────────
export const submissionAPI = {
  submit:       (testId, answers)  => post('/submissions', { testId, answers }),
  getMyResults: ()                 => get('/submissions/my-results'),
  search:       (q)                => get(`/submissions/search?q=${encodeURIComponent(q)}`),
  getForTest:   (testId)           => get(`/submissions/test/${testId}`),
  getById:      (id)               => get(`/submissions/${id}`),
  review:       (id, manualScores) => put(`/submissions/${id}/review`, { manualScores }),
};

// ─── Violations ───────────────────────────────────────────────────────────────
export const violationAPI = {
  log:            (testId, type, severity, notes) => post('/violations', { testId, type, severity, notes }),
  getForTest:     (testId)  => get(`/violations/test/${testId}`),
  getStudentSummary: (testId) => get(`/violations/students/${testId}`),
};
