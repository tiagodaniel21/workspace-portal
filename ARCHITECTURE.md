# Arquitetura

## Visão geral

O navegador entrega a interface React e se comunica diretamente com a API segura do Supabase. A publishable key identifica o projeto, mas não concede acesso aos dados: o JWT da sessão e as políticas RLS decidem quais linhas podem ser lidas ou alteradas.

```text
React (Cloudflare Pages)
  ├─ Supabase Auth ── sessão/JWT
  └─ Supabase Client ── PostgREST / RPC
                           └─ PostgreSQL + RLS
```

Vite gera arquivos estáticos em `dist`; Cloudflare Pages não executa backend próprio. Isso mantém a publicação simples e gratuita. Tailwind CSS 4 está integrado pelo plugin oficial do Vite, e os tokens visuais ficam como variáveis CSS em `src/index.css`.

## Pastas

- `src/components`: componentes reutilizáveis e proteção de rotas.
- `src/layouts`: sidebar, cabeçalho e área principal.
- `src/pages`: composição de cada tela.
- `src/contexts`: autenticação e tema.
- `src/hooks`: carregamento assíncrono reutilizável.
- `src/lib`: criação do cliente Supabase.
- `src/types`: tipos do domínio/banco.
- `src/utils`: regras puras, fáceis de testar.
- `supabase/migrations`: banco versionado.
- `supabase/tests`: roteiro de verificação de segurança.

## Autenticação

`AuthProvider` chama `getSession()` ao abrir o aplicativo e escuta `onAuthStateChange`. Assim, uma sessão válida é restaurada após recarregar. `ProtectedRoute` só monta o layout privado depois dessa verificação; sem usuário, redireciona a `/login`. O produto não chama `signUp`, e o cadastro público também deve ser desabilitado no painel.

## Controle de ponto

O frontend nunca escolhe o horário oficial nem escreve diretamente em `work_sessions`/`work_breaks`. Cada botão chama uma RPC. No banco, a função:

1. exige `auth.uid()`;
2. obtém um advisory lock por usuário, serializando cliques concorrentes;
3. bloqueia a jornada relevante com `FOR UPDATE`;
4. valida o estado atual;
5. usa `clock_timestamp()` do servidor;
6. grava tudo na mesma transação.

Índices parciais garantem, mesmo sob concorrência, no máximo uma jornada aberta por usuário e uma pausa aberta por jornada. O banco exige retorno da pausa antes da saída. A tela deriva o cronômetro dos timestamps persistidos e desconta todas as pausas; recarregar não perde estado.

## Relacionamentos e isolamento

`auth.users` tem um `profile` e é proprietário de todos os registros. Clientes têm projetos; projetos têm tarefas; tarefas também podem ser pessoais. FKs compostas `(id, user_id)` impedem vincular um projeto ao cliente de outra pessoa e uma tarefa ao projeto de outra pessoa. A exclusão do cliente/projeto vinculado é `RESTRICT` para evitar perda acidental.

Todas as tabelas têm RLS. Operações de negócio usam a condição `auth.uid() = user_id`. As tabelas de ponto expõem somente leitura via RLS; gravações são exclusivas das RPCs `SECURITY DEFINER`, com `search_path` fixo, nomes totalmente qualificados e permissão de execução apenas para `authenticated`.

## Decisões de manutenção

- Sem gerenciador de estado global adicional: sessão e tema usam Context; dados de páginas são locais.
- Sem backend duplicado: integridade importante vive no PostgreSQL, onde todas as chamadas passam.
- Arquivamento em projetos preserva histórico; clientes com dependências não são apagados.
- Funções puras de tempo, transições e progresso têm testes unitários independentes do navegador.
- Estados de carregamento, erro, vazio e sucesso aparecem nas operações principais.
