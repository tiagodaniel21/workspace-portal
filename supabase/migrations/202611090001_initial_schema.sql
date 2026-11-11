-- WorkSpace — schema, RLS and atomic time-clock RPCs
create extension if not exists pgcrypto;

create type public.project_status as enum ('planned', 'in_progress', 'completed', 'archived');
create type public.task_status as enum ('pending', 'in_progress', 'completed');
create type public.task_priority as enum ('low', 'medium', 'high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 140),
  daily_target_minutes integer not null default 480 check (daily_target_minutes between 15 and 1440),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.work_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(), ended_at timestamptz, created_at timestamptz not null default now(),
  constraint valid_session_range check (ended_at is null or ended_at >= started_at)
);
create unique index one_open_session_per_user on public.work_sessions(user_id) where ended_at is null;
create index work_sessions_user_started_idx on public.work_sessions(user_id, started_at desc);
create table public.work_breaks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  work_session_id uuid not null references public.work_sessions(id) on delete cascade,
  started_at timestamptz not null default now(), ended_at timestamptz, created_at timestamptz not null default now(),
  constraint valid_break_range check (ended_at is null or ended_at >= started_at)
);
create unique index one_open_break_per_session on public.work_breaks(work_session_id) where ended_at is null;
create index work_breaks_session_idx on public.work_breaks(work_session_id, started_at);
create table public.clients (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 140), company text check (char_length(company) <= 160),
  email text check (char_length(email) <= 254), phone text check (char_length(phone) <= 30), notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, user_id)
);
create index clients_user_name_idx on public.clients(user_id, name);
create table public.projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid, name text not null check (char_length(name) between 1 and 160), description text,
  status public.project_status not null default 'planned', due_date date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id, user_id),
  constraint project_client_same_owner foreign key (client_id, user_id) references public.clients(id, user_id) on delete restrict
);
create index projects_user_status_idx on public.projects(user_id, status);
create index projects_client_idx on public.projects(client_id);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid, assigned_to uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160), description text,
  priority public.task_priority not null default 'medium', status public.task_status not null default 'pending', due_date date,
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint task_project_same_owner foreign key (project_id, user_id) references public.projects(id, user_id) on delete restrict,
  constraint completed_state_consistency check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null)),
  constraint assignment_is_owner check (assigned_to is null or assigned_to = user_id)
);
create index tasks_user_status_idx on public.tasks(user_id, status);
create index tasks_user_due_idx on public.tasks(user_id, due_date);
create index tasks_project_idx on public.tasks(project_id);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger clients_updated before update on public.clients for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id, full_name) values(new.id, coalesce(new.raw_user_meta_data ->> 'full_name', '')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.work_sessions enable row level security;
alter table public.work_breaks enable row level security; alter table public.clients enable row level security;
alter table public.projects enable row level security; alter table public.tasks enable row level security;
create policy profiles_owner_all on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy sessions_owner_select on public.work_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy breaks_owner_select on public.work_breaks for select to authenticated using ((select auth.uid()) = user_id);
create policy clients_owner_all on public.clients for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy projects_owner_all on public.projects for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tasks_owner_all on public.tasks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (assigned_to is null or assigned_to = (select auth.uid())));

-- RPCs are the only write path for point records. Row locks and partial unique indexes handle concurrent clicks.
create or replace function public.clock_in() returns public.work_sessions language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); result public.work_sessions;
begin
  if uid is null then raise exception 'Autenticação obrigatória'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if exists(select 1 from public.work_sessions where user_id = uid and ended_at is null) then raise exception 'Já existe uma jornada aberta'; end if;
  insert into public.work_sessions(user_id, started_at) values(uid, clock_timestamp()) returning * into result; return result;
end $$;
create or replace function public.start_break() returns public.work_sessions language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); session_row public.work_sessions;
begin
  if uid is null then raise exception 'Autenticação obrigatória'; end if; perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select * into session_row from public.work_sessions where user_id = uid and ended_at is null for update;
  if not found then raise exception 'Não há jornada ativa'; end if;
  if exists(select 1 from public.work_breaks where work_session_id = session_row.id and ended_at is null) then raise exception 'Já existe uma pausa ativa'; end if;
  insert into public.work_breaks(user_id, work_session_id, started_at) values(uid, session_row.id, clock_timestamp()); return session_row;
end $$;
create or replace function public.end_break() returns public.work_sessions language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); session_row public.work_sessions; affected integer;
begin
  if uid is null then raise exception 'Autenticação obrigatória'; end if; perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select * into session_row from public.work_sessions where user_id = uid and ended_at is null for update;
  if not found then raise exception 'Não há jornada ativa'; end if;
  update public.work_breaks set ended_at = clock_timestamp() where user_id = uid and work_session_id = session_row.id and ended_at is null; get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Não há pausa ativa'; end if; return session_row;
end $$;
create or replace function public.clock_out() returns public.work_sessions language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); session_row public.work_sessions;
begin
  if uid is null then raise exception 'Autenticação obrigatória'; end if; perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  select * into session_row from public.work_sessions where user_id = uid and ended_at is null for update;
  if not found then raise exception 'Não há jornada ativa'; end if;
  if exists(select 1 from public.work_breaks where work_session_id = session_row.id and ended_at is null) then raise exception 'Retorne da pausa antes de encerrar'; end if;
  update public.work_sessions set ended_at = clock_timestamp() where id = session_row.id returning * into session_row; return session_row;
end $$;
revoke all on function public.clock_in() from public, anon; revoke all on function public.start_break() from public, anon;
revoke all on function public.end_break() from public, anon; revoke all on function public.clock_out() from public, anon;
grant execute on function public.clock_in() to authenticated; grant execute on function public.start_break() to authenticated;
grant execute on function public.end_break() to authenticated; grant execute on function public.clock_out() to authenticated;
