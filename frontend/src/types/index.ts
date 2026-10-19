export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}