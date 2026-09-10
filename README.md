# Movimento · Gestão de treino

MVP de um SaaS B2B para academias independentes organizarem professores, acompanharem alunos e encontrarem rapidamente quem precisa de atenção.

O produto não é uma ficha de treino isolada. Ele conecta a operação da academia ao treino executado pelo aluno:

- a administração enxerga indicadores e pendências calculadas;
- professores trabalham com a própria carteira de alunos, templates e histórico;
- alunos registram treino, séries, cargas e repetições em uma experiência web mobile-first.

## O que o MVP entrega

### Administração

- dashboard com alunos ativos, professores, treinos vencidos, treinos próximos do vencimento, alunos sem treino e alunos sem atividade;
- lista pesquisável e filtrável de alunos;
- cadastro de professores e alunos;
- associação de aluno a professor responsável;
- catálogo de exercícios globais e personalizados da academia;
- pendências derivadas dos dados reais, sem tabela artificial de tarefas.

### Professores

- acesso somente aos alunos atribuídos a eles;
- perfil do aluno com visão geral, treino, histórico e avaliações;
- templates com múltiplos dias e exercícios;
- atribuição de template com cópia independente para o aluno;
- duplicação de treino;
- criação rápida de treino simples;
- registro de avaliação física básica.

### Alunos

- área web otimizada para celular;
- visualização do treino atual e última carga por exercício;
- início e retomada de treino;
- registro de carga e repetições por série;
- finalização persistida da sessão;
- histórico de sessões e avaliações;
- evolução de peso e cintura quando existirem pelo menos duas avaliações.

## Stack

- Next.js 16 com App Router e TypeScript estrito;
- React 19;
- Tailwind CSS 4;
- PostgreSQL 16;
- Prisma ORM 6;
- Auth.js / NextAuth com login por credenciais;
- Zod para validação de entradas;
- Vitest para testes de domínio;
- Docker Compose para banco local.

## Arquitetura

É um monólito modular: UI, ações de servidor e acesso a dados vivem no mesmo projeto Next.js, sem microserviços.

```text
src/
├── app/
│   ├── (panel)/        # painel de administração e professores
│   ├── (student)/      # área mobile-first do aluno
│   ├── actions/        # mutações protegidas via Server Actions
│   └── api/auth/       # autenticação Auth.js
├── components/         # componentes visuais e formulários
├── lib/
│   ├── auth.ts         # sessão e vínculo ativo
│   ├── permissions.ts  # RBAC e regras de acesso ao aluno
│   ├── queries.ts      # consultas com filtro por organização
│   ├── attention.ts    # cálculo de pendências
│   └── workout-domain.ts
└── proxy.ts            # redirecionamento otimista de rotas privadas

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

### Multi-tenancy

`Organization` é a raiz do tenant. Todo recurso de negócio pertence a uma organização, direta ou indiretamente:

- `Membership` liga usuário, organização e papel (`ADMIN`, `PROFESSOR` ou `STUDENT`);
- perfis de aluno, planos, sessões, avaliações, templates e exercícios personalizados carregam `organizationId`;
- o tenant é derivado da sessão no servidor — nunca de um `organizationId` enviado pelo navegador;
- cada consulta e Server Action valida a organização e, quando aplicável, a propriedade do aluno.

O professor só enxerga alunos atribuídos a ele. O aluno só enxerga o próprio perfil. Administradores só atuam na própria organização.

## Segurança

- senhas com hash `bcrypt` (cost 12);
- sessão JWT segura do Auth.js com duração de 8 horas;
- rotas privadas com Proxy apenas como camada de conveniência;
- autorização revalidada no servidor em cada mutação;
- validação Zod de todos os formulários;
- proteção contra IDOR e cross-tenant nas consultas de aluno, planos, sessão e avaliação;
- segredos somente em variáveis de ambiente; nenhum `.env` é versionado.

> O Proxy não é usado como barreira de autorização. A proteção efetiva ocorre na camada de autenticação, nas consultas e nas Server Actions.

## Pré-requisitos

- Node.js 22+ (Node 24 recomendado);
- npm 10+;
- Docker Desktop ou Docker Engine com Docker Compose.

## Início rápido

1. Clone o repositório e entre na pasta.

   ```bash
   git clone https://github.com/GabrielSantanaBR/projeto_academia.git
   cd projeto_academia
   ```

2. Crie o arquivo de ambiente.

   ```bash
   cp .env.example .env
   ```

3. Defina um segredo real em `NEXTAUTH_SECRET`.

   ```bash
   openssl rand -base64 32
   ```

   Copie o resultado para `NEXTAUTH_SECRET` no `.env`.

4. Suba o PostgreSQL local.

   ```bash
   docker compose up -d
   ```

5. Instale as dependências, gere o cliente e aplique as migrations.

   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   ```

6. Carregue os dados demonstrativos e inicie a aplicação.

   ```bash
   npm run db:seed
   npm run dev
   ```

Abra [http://localhost:3000](http://localhost:3000).

## Contas de demonstração

Todas usam a senha `Demo123!`.

| Perfil | E-mail | O que demonstrar |
| --- | --- | --- |
| Administrador | `admin@movimento.fit` | Dashboard, professores, alunos e pendências |
| Professor | `rafael@movimento.fit` | Carteira, templates, treino e avaliações |
| Aluno | `aluno@movimento.fit` | Treino no celular, séries, histórico e evolução |

O seed cria uma academia fictícia, quatro professores, 25 alunos, exercícios, dois templates, planos ativos/vencidos, sessões e avaliações. Também inclui cenários de aluno novo sem treino, treino vencido, treino próximo do vencimento e falta de atividade recente.

## Scripts

| Comando | Uso |
| --- | --- |
| `npm run dev` | inicia o ambiente de desenvolvimento |
| `npm run build` | gera a build de produção |
| `npm run start` | inicia a build de produção |
| `npm run lint` | executa ESLint |
| `npm run typecheck` | verifica TypeScript sem emitir arquivos |
| `npm test` | executa os testes Vitest |
| `npm run db:generate` | gera o Prisma Client |
| `npm run db:migrate` | aplica/cria migrations no ambiente local |
| `npm run db:deploy` | aplica migrations existentes em produção |
| `npm run db:seed` | recria os dados demonstrativos |

Para produção, aplique as migrations com:

```bash
npm run db:deploy
```

## Modelo de dados principal

| Entidade | Responsabilidade |
| --- | --- |
| `Organization` | academia/tenant |
| `User` + `Membership` | identidade, vínculo e papel dentro da academia |
| `StudentProfile` | objetivo, professor responsável, status e observações |
| `Exercise` | catálogo global ou personalizado por academia |
| `TrainingTemplate` | modelos reutilizáveis com dias e exercícios |
| `WorkoutPlan` | cópia individual publicada para o aluno |
| `WorkoutSession` | execução real de um dia de treino |
| `WorkoutSet` | carga e repetições de cada série |
| `PhysicalAssessment` | medidas físicas sem diagnóstico médico |

## Testes

Os testes de domínio cobrem os riscos mais importantes do MVP:

- isolamento entre academias e RBAC;
- acesso de professor apenas à própria carteira;
- cálculo de pendências por datas reais;
- clonagem independente de template ao atribuir treino;
- validação de série e duração de sessão.

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Decisões de produto e engenharia

- Um aluno tem um professor principal no MVP. O modelo mantém a associação fora do usuário e pode evoluir para uma tabela de múltiplos profissionais no futuro.
- Ao atribuir ou duplicar um treino, o plano publicado anterior é arquivado. Isso evita ambiguidade sobre qual treino é o atual.
- Templates são imutáveis do ponto de vista do aluno: atribuir significa copiar os dias e exercícios para um `WorkoutPlan` próprio.
- Pendências são calculadas, não cadastradas manualmente. Isso reduz duplicação e mantém o dashboard fiel ao banco.
- A área do aluno é uma aplicação web responsiva com `manifest.ts`, preparada para evolução a PWA sem criar app nativo agora.

## Fora do escopo deste MVP

- pagamentos, mensalidades e financeiro;
- catraca, biometria e acesso físico;
- chat, CRM completo, aulas coletivas e reservas;
- dieta, nutrição, fisioterapia ou diagnóstico médico;
- IA, geração automática de treino e previsão de evasão;
- integrações com smartwatch, Health, Garmin, Strava ou sistemas externos;
- aplicativos Android/iOS nativos, gamificação e rede social.

## Próximas evoluções possíveis

1. múltiplas unidades por organização;
2. múltiplos profissionais por aluno;
3. edição detalhada de cada plano individual;
4. score de engajamento e risco de evasão;
5. integrações de acesso e financeiras;
6. notificações de revisão e ausência;
7. app mobile nativo usando a mesma API e regras de autorização.
