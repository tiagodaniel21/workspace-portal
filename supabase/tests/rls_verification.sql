-- Execute no SQL Editor de um projeto de teste, após criar dois usuários A e B.
-- Substitua os UUIDs abaixo e rode cada bloco com JWT apropriado usando o Supabase CLI.
-- 1) Como usuário A, inserir um cliente com user_id=A deve funcionar.
-- 2) Como usuário B, SELECT/UPDATE/DELETE desse cliente devem afetar zero linhas.
-- 3) Como usuário B, INSERT com user_id=A deve falhar pela política WITH CHECK.
-- 4) Como anon, SELECT em qualquer tabela e EXECUTE das quatro RPCs devem falhar.
-- 5) Como usuário A, vincular projeto/tarefa a client/project de B deve falhar pela FK composta.
-- 6) Em duas transações concorrentes, chamar clock_in() para A: uma deve vencer; outra deve falhar.

select schemaname, tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('profiles','work_sessions','work_breaks','clients','projects','tasks');
select routine_name, security_type from information_schema.routines
where routine_schema = 'public' and routine_name in ('clock_in','start_break','end_break','clock_out');
