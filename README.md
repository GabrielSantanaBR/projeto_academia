# Movimento · Treino, corrida e comunidade

Plataforma web para academias independentes, com operação da administração, carteira do professor, registro do treino pelo aluno, corrida com GPS, comunidade interna e acompanhamento nutricional. Esta versão prepara os fluxos para uma implantação piloto com homologação da academia.

## Funcionalidades

| Perfil | Recursos |
| --- | --- |
| Administração | Indicadores e pendências; equipe de professores e nutricionistas; alunos e vínculos; moderação da comunidade; identidade da academia; CSV e recuperação assistida de acesso |
| Professor | Carteira e resumo de corridas dos alunos; exercícios com links de vídeo; modelos e treinos individuais; renovação de ciclos; avaliações e histórico |
| Nutricionista | Carteira própria, planos individuais com orientações e refeições, versões anteriores; sem acesso ao treino ou à localização do aluno |
| Aluno | Treino no celular com demonstração em vídeo sob demanda; séries e histórico; corridas com GPS, mapa privado e ritmo; comunidade com posts, comentários e curtidas; plano alimentar individual |

O editor suporta até sete dias por plano e vinte exercícios por dia. Cada publicação cria uma versão independente: revisar um treino preserva as sessões anteriores. Uma sessão só registra como feitas as séries marcadas pelo aluno; registros não salvos são sinalizados. Alterações concorrentes em outra aba são recusadas para evitar sobrescrita silenciosa.

Os painéis têm navegação ativa, busca, estados vazios, feedback de formulários e adaptação a celular. Nome, contato e cor da academia são configuráveis. A aplicação requer internet: não há sincronização offline nem aplicativo nativo.

**Vídeos:** professor ou administrador vincula um URL HTTPS do YouTube/Vimeo a um exercício da academia; o player só carrega quando o aluno o abre. Não há upload, hospedagem ou direitos automáticos sobre vídeos de terceiros.

**Corrida:** o aluno inicia o GPS explicitamente, pausa e salva no navegador com HTTPS. Distância é recalculada no servidor, pulos de sinal são ignorados e o trajeto é particular, com opção de exclusão. A comunidade não recebe rotas. O mapa carrega blocos do OpenStreetMap apenas ao ser exibido; o navegador pode interromper o GPS em segundo plano ou com a tela bloqueada. Não há integração com a conta Strava, desafios ou navegação guiada.

**Nutrição e comunidade:** a administração cadastra profissionais e vincula alunos; só o nutricionista responsável e o aluno leem o conteúdo do plano. Vincular outro profissional arquiva o plano anterior. O feed é restrito à academia, com ocultação por autores e administradores, sem fotos, mensagens privadas ou compartilhamento automático de dados de saúde.

## Stack e organização

Next.js 16 / React 19 / TypeScript / Tailwind CSS 4, PostgreSQL 16, Prisma 6, NextAuth por credenciais, Zod, Vitest e Playwright. As versões exatas ficam em `package-lock.json`. Requer Node.js 22 ou superior; a configuração Render utiliza Node 24.

- `src/app/(panel)`: administração e professores.
- `src/app/(student)`: área do aluno.
- `src/app/(community)`: feed compartilhado por perfis da academia.
- `src/app/actions`: mutações e autorização no servidor.
- `src/lib`: autenticação, isolamento entre academias, validação e regras do treino.
- `prisma`: modelo de dados, migrations e demonstração.
- `scripts`: criação inicial de uma academia e inicialização de produção.
- `tests`: domínio e integração com PostgreSQL descartável.

`Organization` identifica a academia. O vínculo ativo (`Membership`) define o papel. O servidor deriva a organização da sessão e verifica a carteira do professor ou o perfil do aluno em cada operação. O redirecionamento do Proxy é apenas uma conveniência de navegação; a autorização é refeita no servidor.

## Rodar localmente

```bash
git clone https://github.com/GabrielSantanaBR/projeto_academia.git
cd projeto_academia
cp .env.example .env
npm ci
docker compose up -d
npm run db:generate
npm run db:deploy
```

Preencha `NEXTAUTH_SECRET` com um segredo gerado por `openssl rand -base64 32`. O banco do Docker Compose usa apenas credenciais locais de desenvolvimento. Depois escolha **uma** das opções abaixo.

### Academia real, sem dados fictícios

Preencha no ambiente `ACADEMY_NAME`, `ACADEMY_SLUG`, `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` (12–72 caracteres). Mantenha `DEMO_MODE=false` e `ALLOW_DEMO_SEED=false`.

```bash
npm run setup:academy
npm run dev
```

O comando cria a academia, o primeiro administrador e um catálogo inicial de 14 exercícios. Exige troca da senha no primeiro acesso. Recusa slug/e-mail já existentes e não substitui credenciais. Remova `ADMIN_PASSWORD` do ambiente após a criação. Acesse [localhost:3000](http://localhost:3000), troque a senha, cadastre um professor e depois os alunos.

### Demonstração comercial em banco separado

Em um banco vazio exclusivo de demonstração, configure `DEMO_MODE=true` e `ALLOW_DEMO_SEED=true`.

```bash
npm run db:seed
npm run demo:enrich
npm run dev
```

O seed cria 25 alunos, quatro professores, modelos, planos, sessões, avaliações e cenários de pendência. Ele não apaga dados: se a demonstração já existe, encerra sem alterações. `demo:enrich` adiciona profissional, plano fictício, publicações, corrida e um vídeo apenas ao banco demonstrativo isolado, de forma idempotente. No Railway, o pre-deploy executa ambos quando as duas flags são `true`. Nunca use essas flags em produção real.

| Perfil | E-mail | Senha de demonstração |
| --- | --- | --- |
| Administrador | `admin@movimento.fit` | `Demo123!` |
| Professor | `rafael@movimento.fit` | `Demo123!` |
| Aluno | `aluno@movimento.fit` | `Demo123!` |
| Nutricionista | `nutri@movimento.fit` | `Demo123!` |

Essas contas são públicas e exclusivas de demonstração. Usar `DEMO_MODE=false` oculta a divulgação das contas, mas não remove usuários já criados: produção deve começar com seu próprio banco e credenciais.

## Segurança e integridade

- Hash bcrypt com custo 12; sessões de oito horas e limitação persistida de tentativas de login por e-mail (dez tentativas em quinze minutos).
- Mudança de senha invalida sessões anteriores; recuperação feita pelo administrador exige reautenticação e gera senha temporária. Não há envio de e-mail transacional configurado.
- Vínculos desativados e alunos inativos perdem acesso; o administrador deve transferir alunos ativos antes de desativar um professor.
- O navegador só pode solicitar GPS à própria origem; percursos e orientações alimentares têm autorização específica no servidor. A academia precisa definir base legal, retenção e resposta aos titulares antes de tratar dados reais de saúde e localização.
- Índices únicos e transações evitam dois planos publicados ou duas sessões em andamento por aluno.
- Versões de sessão e bloqueios no banco protegem gravações concorrentes. Snapshots preservam nomes, unidades e orientações do treino executado.
- Validação no servidor; mensagens de erro sem detalhes internos; CSV protegido contra interpretação de fórmulas; exportação apenas administrativa, sem medidas físicas.
- Cabeçalhos contra enquadramento e interpretação de conteúdo; health check sem exposição de credenciais.

## Validação

```bash
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build
```

Os testes de integração usam PostgreSQL real e recusam execução sem `TEST_DATABASE_URL` com um nome de banco contendo `test`. Crie um banco descartável, aplique as migrations nele e execute:

```bash
# Configure estas variáveis somente para o banco descartável.
export TEST_DATABASE_URL="postgresql://movimento:movimento@localhost:5432/movimento_test"
DATABASE_URL="$TEST_DATABASE_URL" npm run db:deploy
npm run test:integration
```

A integração exercita treino, comunidade, nutricionista, percurso, isolamento de academias, permissões, credenciais e recuperação. A suíte usa dados próprios; não aponte para a produção.

Para verificar a interface sobre a build de produção, mantenha `TEST_DATABASE_URL` configurada e execute:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

O Playwright inicia a aplicação automaticamente e cria academias fictícias exclusivas para a verificação em desktop e celular. Exercita cadastro, treinos, nutrição, comunidade, navegação de corrida e restrição de acesso. O relatório, capturas e traces de falha ficam em `playwright-report/` e `test-results/` (não versionados). A precisão real de GPS exige teste em telefone com HTTPS ao ar livre.

O workflow [Verificação do produto](.github/workflows/ci.yml) instala as dependências, inicia PostgreSQL 16, aplica migrations, executa lint, tipos e testes, compila a aplicação e verifica os fluxos no Chromium em desktop e celular. Os relatórios ficam anexados à execução por sete dias. O resultado de cada execução fica na aba Actions do GitHub; a existência do workflow não substitui uma execução aprovada.

## Implantação e entrega

- [Instalação, atualização e operação no Render](docs/IMPLANTACAO.md)
- [Escopo comercial e roteiro de entrega em cinco dias](docs/ENTREGA_5_DIAS.md)
- [Evidências e limites da validação](docs/VALIDACAO.md)
- [Escopo e privacidade da experiência integrada](docs/EXPERIENCIA_INTEGRADA.md)

`render.yaml` prepara serviço web e PostgreSQL na mesma região, migrations antes da liberação, segredo gerado e `/api/health`. Ele utiliza planos pagos: confira valores e backups disponíveis na conta antes de criar os recursos. Nenhum deploy é feito apenas por clonar este repositório.

Antes de migrar um banco existente, faça e verifique um backup. A migration 0.2 é aditiva e não apaga registros; se houver planos publicados ou sessões em andamento duplicados, os novos índices recusam a migration. Resolva esses casos com o responsável pelos dados antes de reaplicar; não use reset ou seed para atualizar produção.

## Escopo comercial

A entrega inclui gestão de treinamento, vídeos por link, corrida web com GPS, feed interno e planos de nutricionista. Pagamentos, mensalidades, catracas, biometria, mensagens privadas, disparos de WhatsApp, IA, app nativo e importação automática de bases legadas exigem outro escopo.

Uma entrega em cinco dias depende de infraestrutura acessível, materiais e decisões da academia no primeiro dia, escopo fechado e disponibilidade para homologação. A configuração de domínio, política de backup e teste com usuários reais fazem parte da implantação. Não apresente o prazo como garantia para integrações ainda não implementadas.
