export type RequestStatus = 'new' | 'in_progress' | 'need_info' | 'closed';

export interface SupportRequest {
  id: number;
  requester_name: string;
  requester_email: string;
  title: string;
  description: string;
  status: RequestStatus;
  manager_comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestInput {
  requester_name: string;
  requester_email: string;
  title: string;
  description: string;
}

export interface UpdateRequestInput {
  status: RequestStatus;
  manager_comment: string;
}
