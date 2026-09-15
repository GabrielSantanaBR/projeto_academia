# Implantação e operação · Movimento

## Nova instalação no Render

1. Vincule este repositório à conta Render e crie um Blueprint usando `render.yaml`. Confira e aceite os custos dos dois recursos na própria conta antes de confirmar.
2. O Blueprint cria web e PostgreSQL na mesma região. O acesso externo ao banco fica desabilitado. O build instala dependências e gera Prisma; o pre-deploy aplica migrations; o health check consulta o banco.
3. O script de início usa `NEXTAUTH_URL`, quando fornecido, ou `RENDER_EXTERNAL_URL`. Ao usar domínio próprio, configure `NEXTAUTH_URL=https://seu-dominio` antes da liberação. `NEXTAUTH_SECRET` é gerado pelo Blueprint. Produção exige segredo com pelo menos 32 caracteres e URL HTTPS.
4. Mantenha `DEMO_MODE=false` e `ALLOW_DEMO_SEED=false`. No ambiente do serviço, defina temporariamente `ACADEMY_NAME`, `ACADEMY_SLUG`, `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` (12–72 caracteres).
5. Abra o Shell do serviço e execute `npm run setup:academy` uma única vez. Não execute `db:seed` em produção. Remova `ADMIN_PASSWORD` após o sucesso e entregue a senha temporária ao titular por canal privado.
6. O administrador entra, troca a senha e configura nome, contato, cidade e cor em Configurações. Depois cadastra os professores, alunos e primeiros treinos.
7. Verifique `/api/health`, login dos três perfis, treino completo no celular, logout, recuperação assistida e exportação CSV. Use o roteiro de aceite antes de convidar toda a academia.

O Blueprint espera verificações aprovadas no GitHub para deploys automáticos. Se a conta não liberar Actions, valide o commit e faça o primeiro deploy manualmente após conferir os testes; não marque falhas como aprovadas.

## Atualizar uma base existente

1. Identifique o commit em produção e salve um backup recuperável do PostgreSQL, incluindo data e responsável.
2. Restaure uma cópia isolada e execute `npm run db:deploy` nessa cópia antes de programar a atualização.
3. A migration `20260910000000_commercial_readiness` adiciona campos, unidades, controle de sessão e índices. Não redefine nem remove usuários, planos ou sessões.
4. Verifique duplicidades com as consultas abaixo. Se retornarem linhas, o índice novo recusará a migration. O responsável deve decidir qual plano manter publicado e qual sessão encerrar; preserve o histórico.
5. Publique o commit validado, acompanhe o pre-deploy e confirme health check e fluxo de login. Mudanças de banco exigem um plano próprio de reversão: reverter o código não desfaz a migration.

```sql
SELECT "studentId", COUNT(*) FROM "WorkoutPlan"
WHERE status = 'PUBLISHED' GROUP BY "studentId" HAVING COUNT(*) > 1;

SELECT "studentId", COUNT(*) FROM "WorkoutSession"
WHERE status = 'IN_PROGRESS' GROUP BY "studentId" HAVING COUNT(*) > 1;
```

Nunca execute `prisma migrate reset`, `db push --accept-data-loss` ou o seed para corrigir produção.

## Backup e recuperação

Defina um responsável, frequência, retenção e tempo máximo aceitável de recuperação com a academia. Confirme os recursos disponíveis no plano contratado. Antes do aceite, restaure um backup em banco isolado e verifique usuários, planos e sessões; registrar apenas que um backup foi criado não valida a recuperação.

O CSV da aplicação é uma lista operacional de alunos e não substitui backup completo. Medidas físicas e dados de acesso não entram nessa exportação.

## Acessos

- O administrador redefine a senha de professor/aluno pelo cadastro, confirmando sua própria senha. O titular deve trocar a senha temporária no primeiro acesso.
- Para desativar professor, transfira os alunos ativos antes. Para desativar aluno, altere o status no cadastro. Sessões antigas perdem validade quando o status é alterado.
- A conta usa e-mail único. Uma identidade compartilhada por duas academias não pode ter a senha redefinida pelo administrador de apenas uma delas.
- A recuperação do administrador inicial depende do operador da instalação; defina esse contato antes da entrega. Não há recuperação automática por e-mail.

## Homologação e limites operacionais

Execute o checklist de entrega com ao menos um administrador, um professor e dois alunos em celular real. Nesta versão, o histórico e as consultas não têm paginação em todas as telas; monitore o volume de uma academia piloto antes de assumir capacidade para uma grande rede. Não foi estabelecida capacidade por teste de carga.

A aplicação não executa treino offline, não envia notificações e não sincroniza catracas ou financeiro. Configure os responsáveis pelo uso, suporte, guarda de dados e atendimento ao aluno junto ao cliente.
