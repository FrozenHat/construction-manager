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

export interface Stage {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
}

export interface Task {
  id: string;
  name: string;
  status: string;
  foremanFee: string | null;
  contractorFee: string | null;
  deadline: string | null;
  pauseReason?: string | null;
  pauseComment?: string | null;
}