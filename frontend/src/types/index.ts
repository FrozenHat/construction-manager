export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  roles?: { code: string; name: string }[];
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
  clientPrice: string | null;
  contractorFee: string | null;
  foremanFee: string | null;
  deadline: string | null;
  pauseReason?: string | null;
  pauseComment?: string | null;
  
  // Связи с пользователями (приходят с бэкенда)
  foremanId?: string | null;
  foreman?: User | null;
  contractorId?: string | null;
  contractor?: User | null;
  
  stageId: string; // Добавим для удобства
}
export interface AppDocument {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
  version: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
}