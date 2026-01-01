import { apiClient } from "./client";

export interface StudentSyncResponse {
  student_id: string;
  student_name: string;
  degree: string;
  program: string;
  cgpa: number;
}

export async function syncStudentData(
  student_id: string
): Promise<StudentSyncResponse> {
  const response = await apiClient.get(`/students/sync/${student_id}`);
  return response.data;
}
