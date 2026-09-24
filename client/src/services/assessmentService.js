import { api } from "../api/api.js";

export const assessmentService = {
  getQuestions: (testType) => api.get(`/assessments/${testType}`),
  getMyResults: () => api.get("/assessments/results/me"),
  submit: (testType, answers) =>
    api.post(`/assessments/${testType}/submit`, { answers }),
};
