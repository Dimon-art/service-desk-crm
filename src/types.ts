export type RequestStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'need_info'
  | 'completed'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'closed';

export interface SupportRequest {
  id: number;
  requester_name: string;
  requester_email: string;
  title: string;
  description: string;
  status: RequestStatus;
  manager_comment: string;
  assignee: string;
  assigned_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  access_token?: string;
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
