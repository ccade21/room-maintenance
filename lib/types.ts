export type Role = "admin" | "user";

export type Room = {
  id: number;
  team: string;
  room_no: string;
  name: string;
  clean_class: string | null;
  temperature: string | null;
  humidity: string | null;
  ac_hr: string | null;
  created_at?: string;
};

export type MaintenanceStatus = "접수" | "진행중" | "완료";

export type MaintenanceRequest = {
  id: string;
  team: string;
  room_no: string;
  status: MaintenanceStatus;
  issue: string;
  issue_image_url: string | null;
  complete_image_url: string | null;
  requester_name: string;
  requester_user_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  created_at?: string;
};