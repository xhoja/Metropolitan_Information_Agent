import api from "./axios";

export const studentService = {
  getCourses: () => api.get("/student/courses"),

  getGrades: () => api.get("/student/grades"),

  getAttendance: () => api.get("/student/attendance"),

  getAssignments: () => api.get("/student/assignments"),

  submitAssignment: (assignmentId, { files }) => {
    const formData = new FormData();
    if (files) files.forEach((f) => formData.append("files", f));
    return api.post(`/student/assignments/${assignmentId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getTranscript: () => api.get("/student/transcript"),
  getCourseMaterials: (courseId) => api.get(`/student/courses/${courseId}/materials`),
  getFinance: () => api.get("/student/finance"),
};

export const miaService = {
  chat: (message, sessionId) =>
    api.post("/mia/chat", { message, session_id: sessionId || null }),
  getSessions: () => api.get("/mia/sessions"),
  getSessionMessages: (sessionId) =>
    api.get(`/mia/sessions/${sessionId}/messages`),
  deleteSession: (sessionId) =>
    api.delete(`/mia/sessions/${sessionId}`),
};
