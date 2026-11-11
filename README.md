# WorkSpace — Meu Escritório Digital

Portal pessoal para registrar jornadas, organizar tarefas, projetos e clientes. O frontend é React/TypeScript; autenticação, persistência, RLS e transições atômicas do ponto ficam no Supabase.

## Requisitos

- Node.js 20.19+ (ou 22.12+)
- npm 10+
- Um projeto Supabase
- Git/GitHub e uma conta Cloudflare para publicação

## Instalação e execução

```bash
npm install
copy .env.example .env
npm run dev
```

Preencha `.env` com a URL e a **publishable key** do projeto. Nunca use `service_role` no frontend.

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publicavel
```

## Configuração do Supabase

1. Crie um projeto no painel do Supabase.
2. Em Authentication > Providers > Email, mantenha e-mail/senha ativo.
3. Em Authentication > Settings, desative novos cadastros públicos (`Allow new users to sign up`). A aplicação não possui tela nem chamada de cadastro.
4. Aplique `supabase/migrations/202611090001_initial_schema.sql` pelo Supabase CLI (`supabase db push`) ou cole o arquivo integral no SQL Editor.
5. Em Authentication > Users, use **Add user** para criar manualmente o usuário inicial e marque o e-mail como confirmado.
6. Copie Project URL e Publishable key para `.env`.

A migration cria tabelas, constraints, índices, triggers, políticas RLS e as RPCs `clock_in`, `start_break`, `end_break` e `clock_out`. Escritas diretas nas tabelas de ponto não têm política; somente as RPCs autenticadas podem alterá-las.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

O roteiro verificável de isolamento entre usuários está em `supabase/tests/rls_verification.sql`. Faça esse teste em um projeto de homologação com dois usuários; ele não deve ser executado contra dados de produção.

## Deploy gratuito no Cloudflare Pages

1. Envie este repositório a um repositório privado no GitHub.
2. No Cloudflare, abra **Workers & Pages > Create > Pages > Connect to Git**.
3. Selecione o repositório e configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22`
4. Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em Settings > Environment variables, para Preview e Production.
5. Publique. O arquivo `public/_redirects` garante que rotas como `/tarefas` retornem ao React Router.
6. No Supabase, inclua a URL do Pages em Authentication > URL Configuration > Site URL e Redirect URLs.

Atualizações futuras: faça commit e push na branch conectada; o Cloudflare reconstrói e publica automaticamente.

## Uso

- `/login`: e-mail e senha do usuário criado pelo administrador.
- `/ponto`: entrada, pausas, retorno e saída são validados no PostgreSQL, com timestamps do servidor.
- `/tarefas`: CRUD, filtros, lista/Kanban e vínculo opcional a projeto.
- `/projetos`: CRUD lógico com arquivamento e progresso calculado pelas tarefas.
- `/clientes`: CRUD com bloqueio de exclusão quando há projeto vinculado.
- `/configuracoes`: perfil, meta diária, tema e encerramento de sessão.

Datas são armazenadas como `timestamptz`. A apresentação de jornada usa `America/Sao_Paulo`. Este produto é um controle pessoal de produtividade, não um sistema de ponto legalmente certificado.

## Arquivos para estudar primeiro

1. `src/App.tsx` — mapa de rotas privadas.
2. `src/contexts/AuthContext.tsx` — restauração e ciclo da sessão.
3. `supabase/migrations/202611090001_initial_schema.sql` — modelo de dados, RLS e regras atômicas.
4. `src/pages/TimePage.tsx` e `src/utils/time.ts` — tela e cálculo do ponto.
5. `src/pages/TasksPage.tsx` — exemplo completo de CRUD real.
6. `ARCHITECTURE.md` — visão do conjunto.
