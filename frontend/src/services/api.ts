const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

export interface RegisterRequest extends LoginRequest {
  name: string;
  confirmPassword: string;
  // Additional fields based on role
  studentId?: string;
  grade?: string;
  department?: string;
  
  qualification?: string;
  experience?: number;
}

export interface AuthResponse {
  user: {
    _id: string;
    username: string;
    email: string;
    name: string;
    role: 'student' | 'teacher';
    avatar?: string;
    // Student-specific fields (only present for students)
    studentId?: string;
    grade?: string;
    rollNumber?: string;
    dateOfBirth?: string;
    guardian?: {
      name?: string;
      email?: string;
      phone?: string;
      relationship?: string;
    };
    // Teacher-specific fields (only present for teachers)
    department?: string;
    qualification?: string;
    experience?: number;
    specialization?: string[];
    // Common fields
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    stats?: any;
    badges?: string[];
    isActive?: boolean;
    isVerified?: boolean;
    preferences?: any;
    createdAt?: string;
    updatedAt?: string;
  };
  token: string;
}

class ApiService {
  generateQuizSuggestions(arg0: { topic: string; questionCount: number; teacherContext: { name: string; subjects: any; gradeLevels: any; }; }) {
    throw new Error('Method not implemented.');
  }
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    console.log('Getting auth headers, token exists:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'An error occurred',
        };
      }

      // Handle backend response format - if data has success field, use it directly
      if (data.success !== undefined) {
        return {
          success: data.success,
          data: data.data,
          message: data.message,
          error: data.error
        };
      }

      // Fallback for other response formats
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error or invalid response',
      };
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
      credentials: 'include', // Include cookies for session
    });

    const result = await this.handleResponse<AuthResponse>(response);
    
    if (result.success && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
    }

    return result;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    const result = await this.handleResponse<AuthResponse>(response);
    
    if (result.success && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
    }

    return result;
  }

  async logout(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    localStorage.removeItem('auth_token');
    return this.handleResponse(response);
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: AuthResponse['user'], authMethod?: string }>> {
    console.log('Making getCurrentUser request to:', `${API_BASE_URL}/api/auth/me`);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    console.log('getCurrentUser response status:', response.status);
    console.log('getCurrentUser response headers:', Object.fromEntries(response.headers.entries()));

    const result = await this.handleResponse<{ user: AuthResponse['user'], authMethod?: string }>(response);
    console.log('getCurrentUser final result:', result);
    
    return result;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    const result = await this.handleResponse<{ token: string }>(response);
    
    if (result.success && result.data?.token) {
      localStorage.setItem('auth_token', result.data.token);
    }

    return result;
  }

  // Generic API method for other endpoints
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(url, config);
    return this.handleResponse<T>(response);
  }

  // Dashboard API methods
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/api/dashboard/stats');
  }

  async getTeacherSubmissions(params?: { limit?: number; status?: string; subject?: string }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.subject) queryParams.append('subject', params.subject);
    
    const url = `/api/dashboard/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(url);
  }

  async getRecentActivity(): Promise<ApiResponse<any[]>> {
    return this.request('/api/dashboard/recent-activity');
  }

  // Materials API methods
  async uploadMaterial(formData: FormData): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/materials/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async getMaterials(): Promise<ApiResponse<any[]>> {
    return this.request('/api/materials');
  }

  async getMaterialById(materialId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/materials/${materialId}`);
  }

  async updateMaterial(materialId: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(materialId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/materials/${materialId}`, {
      method: 'DELETE',
    });
  }

  // Assignments API methods
  async createAssignment(formData: FormData): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async getAssignments(): Promise<ApiResponse<any[]>> {
    return this.request('/api/assignments');
  }

  async getAssignmentById(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}`);
  }

  async updateAssignment(assignmentId: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  async getSubmissions(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}/submissions`);
  }

  async submitAssignment(assignmentId: string, formData: FormData): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async gradeSubmission(submissionId: string, gradeData: { score: number; feedback?: string; status?: string }): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(gradeData)
    });
  }

  async analyzeAssignment(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}/analyze`);
  }

  // Classrooms API methods
  async createClassroom(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClassrooms(): Promise<ApiResponse<any[]>> {
    return this.request('/api/classrooms');
  }

  async getClassroomById(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}`);
  }

  async updateClassroom(classroomId: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClassroom(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}`, {
      method: 'DELETE',
    });
  }

  async generateInviteCode(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}/invite-code`, {
      method: 'POST',
    });
  }

  async getClassroomStudents(classroomId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/classrooms/${classroomId}/students`);
  }

  async getClassroomAssignments(classroomId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/classrooms/${classroomId}/assignments`);
  }

  async getClassroomMaterials(classroomId: string, filters?: { uploadedBy?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);
    
    const queryString = params.toString();
    return this.request(`/api/classrooms/${classroomId}/materials${queryString ? '?' + queryString : ''}`);
  }

  async getClassroomAnalytics(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}/analytics`);
  }

  // Submission API methods
  async startSubmission(assignmentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/submissions/start/${assignmentId}`, {
      method: 'POST'
    });
  }

  async submitAssignment(submissionId: string, answers: any[]): Promise<ApiResponse<any>> {
    return this.request(`/api/submissions/submit/${submissionId}`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  async getSubmission(submissionId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/submissions/${submissionId}`);
  }

  async gradeSubmission(submissionId: string, grades: any[], feedback?: any): Promise<ApiResponse<any>> {
    return this.request(`/api/submissions/grade/${submissionId}`, {
      method: 'POST',
      body: JSON.stringify({ grades, feedback })
    });
  }

  async generateClassroomPin(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}/generate-pin`, {
      method: 'POST'
    });
  }

  async removeStudentFromClassroom(classroomId: string, studentId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  // Doubts API methods
  async getDoubts(assignmentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/api/assignments/${assignmentId}/doubts`);
  }

  async askDoubt(assignmentId: string, doubtData: { question: string; isPublic?: boolean }): Promise<ApiResponse<any>> {
    return this.request(`/api/assignments/${assignmentId}/doubts`, {
      method: 'POST',
      body: JSON.stringify(doubtData)
    });
  }

  async createDoubt(assignmentId: string, question: string): Promise<ApiResponse<any>> {
    return this.askDoubt(assignmentId, { question, isPublic: true });
  }

  async answerDoubt(doubtId: string, answer: string): Promise<ApiResponse<any>> {
    return this.request(`/api/doubts/${doubtId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
  }

  async updateDoubtStatus(doubtId: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/api/doubts/${doubtId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteDoubt(doubtId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/doubts/${doubtId}`, {
      method: 'DELETE',
    });
  }

  async voteDoubt(doubtId: string, voteType: 'up' | 'down'): Promise<ApiResponse<any>> {
    return this.request(`/api/doubts/${doubtId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType })
    });
  }

  // Profile API methods
  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('/api/profile');
  }

  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserBadges(): Promise<ApiResponse<any[]>> {
    return this.request('/api/profile/badges');
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return this.request('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(formData: FormData): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async getTeacherPerformance(): Promise<ApiResponse<any>> {
    return this.request('/api/profile/performance');
  }

  // AI Assistant API methods
  async chatWithAI(message: string, context?: any): Promise<ApiResponse<any>> {
    return this.request('/api/ai-assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  async extractTextFromFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/ai-assistant/extract-text`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      credentials: 'include',
    });
    return this.handleResponse(response);
  }

  async generateQuiz(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ai-assistant/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateMaterialSummary(materialId: string): Promise<ApiResponse<any>> {
    return this.request('/api/ai-assistant/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ materialId }),
    });
  }

  // Student-specific API methods
  async downloadMaterial(materialId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/materials/${materialId}/download`, {
      method: 'POST',
    });
  }

  async viewMaterial(materialId: string, duration?: number): Promise<ApiResponse<any>> {
    return this.request(`/api/materials/${materialId}/view`, {
      method: 'POST',
      body: JSON.stringify({ duration: duration || 0 }),
    });
  }

  async updateStreak(): Promise<ApiResponse<any>> {
    return this.request('/api/student/streak', {
      method: 'POST',
    });
  }

  async updateStudentStats(): Promise<ApiResponse<any>> {
    return this.request('/api/student/stats/update', {
      method: 'POST',
    });
  }

  async getStudentDashboardStats(): Promise<ApiResponse<any>> {
    return this.request('/api/student/stats/dashboard');
  }

  async getStudentMaterials(filters?: { type?: string; subject?: string; classroom?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.classroom) params.append('classroom', filters.classroom);
    
    const queryString = params.toString();
    return this.request(`/api/materials${queryString ? '?' + queryString : ''}`);
  }

  async getStudentAssignments(filters?: { status?: string; subject?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.subject) params.append('subject', filters.subject);
    
    const queryString = params.toString();
    return this.request(`/api/assignments${queryString ? '?' + queryString : ''}`);
  }

  // Classroom management API methods
  async joinClassroom(pin: string): Promise<ApiResponse<any>> {
    return this.request('/api/student/classrooms/join', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }


  async validateClassroomPin(pin: string): Promise<ApiResponse<any>> {
    return this.request('/api/student/classrooms/validate-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async getSubmissionsBySubject(classroomId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/classrooms/${classroomId}/submissions/by-subject`);
  }

  async downloadMaterialFile(materialId: string): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/materials/${materialId}/download`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });
    
    if (response.ok) {
      const blob = await response.blob();
      return { success: true, data: blob };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  }

  async getStudentClassrooms(): Promise<ApiResponse<any>> {
    return this.request('/api/student/classrooms');
  }

  async getStudentDashboardData(): Promise<ApiResponse<any>> {
    return this.request('/api/student/dashboard');
  }

  async getTeacherSubmissions(filters?: { subject?: string; status?: string }): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    return this.request(`/api/teacher/submissions${queryString ? '?' + queryString : ''}`);
  }
}

export const apiService = new ApiService();
export default apiService;
