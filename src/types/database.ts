export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'archived'

export interface Profile { id: string; full_name: string; daily_target_minutes: number; created_at: string; updated_at: string }
export interface Client { id: string; user_id: string; name: string; company: string | null; email: string | null; phone: string | null; notes: string | null; created_at: string; updated_at: string }
export interface Project { id: string; user_id: string; client_id: string | null; name: string; description: string | null; status: ProjectStatus; due_date: string | null; created_at: string; updated_at: string; client?: Pick<Client, 'id' | 'name'> | null; tasks?: Pick<Task, 'id' | 'status'>[] }
export interface Task { id: string; user_id: string; project_id: string | null; assigned_to: string | null; title: string; description: string | null; priority: Priority; status: TaskStatus; due_date: string | null; completed_at: string | null; created_at: string; updated_at: string; project?: Pick<Project, 'id' | 'name'> | null }
export interface WorkBreak { id: string; user_id: string; work_session_id: string; started_at: string; ended_at: string | null; created_at: string }
export interface WorkSession { id: string; user_id: string; started_at: string; ended_at: string | null; created_at: string; work_breaks?: WorkBreak[] }

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile>; Relationships: [] }
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { id?: string }; Update: Partial<Client>; Relationships: [] }
      projects: { Row: Project; Insert: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client' | 'tasks'> & { id?: string }; Update: Partial<Project>; Relationships: [] }
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project'> & { id?: string }; Update: Partial<Task>; Relationships: [] }
      work_sessions: { Row: WorkSession; Insert: Omit<WorkSession, 'id' | 'created_at' | 'work_breaks'> & { id?: string }; Update: Partial<WorkSession>; Relationships: [] }
      work_breaks: { Row: WorkBreak; Insert: Omit<WorkBreak, 'id' | 'created_at'> & { id?: string }; Update: Partial<WorkBreak>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      clock_in: { Args: Record<string, never>; Returns: WorkSession }
      start_break: { Args: Record<string, never>; Returns: WorkSession }
      end_break: { Args: Record<string, never>; Returns: WorkSession }
      clock_out: { Args: Record<string, never>; Returns: WorkSession }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
