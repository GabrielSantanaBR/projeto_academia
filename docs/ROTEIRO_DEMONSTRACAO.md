# Demonstração comercial · Movimento Academia

## Preparação

1. Use um banco PostgreSQL **separado e vazio**. Configure `DEMO_MODE=true`, `ALLOW_DEMO_SEED=true`, `DATABASE_URL` e `NEXTAUTH_SECRET`.
2. Execute `npm ci`, `npm run db:generate`, `npm run db:deploy`, `npm run db:seed` e `npm run dev`. Para mostrar no celular, publique este ambiente em HTTPS; `localhost` no computador não é acessível pelo telefone do cliente.
3. Abra `/login` e confira os três atalhos de acesso. O seed é de uso único e não altera banco existente.
4. Antes de apresentar, teste internet, login, histórico do primeiro aluno e o tamanho da tela do telefone. Faça a apresentação sem nomes ou dados reais do cliente.

## Roteiro de 8 minutos

| Tempo | Perfil e tela | Mostre | Mensagem para o cliente |
| --- | --- | --- | --- |
| 0–2 min | Administrador → Visão geral, Pendências | Alunos ativos, alertas e próximos acompanhamentos | A equipe sabe quem precisa de atenção. |
| 2–3 min | Administrador → Assinaturas | Plano mensal e trimestral; atribuição e validade | A gestão vê planos e vigências em um só lugar. Não há cobrança integrada. |
| 3–5 min | Professor → Alunos → primeiro aluno | Treino publicado, avaliações e histórico de carga | O professor prescreve e ajusta com base em registros reais. |
| 5–6 min | Professor → Aluno → Acompanhamento nutricional; Avaliar vídeos | Conversa fictícia; formulário para responder vídeo | O aluno e a equipe têm um canal de acompanhamento. Links de vídeo dependem de hospedagem externa. |
| 6–8 min | Aluno → Treino, Evolução, Nutrição, Corrida | Série, cronômetro, última carga, gráfico e corrida ilustrativa | O aluno usa a plataforma no navegador do celular. GPS ao vivo exige HTTPS, localização e tela ativa. |

## Escopo do piloto

O produto atual é um aplicativo web responsivo. Pode orientar um futuro aplicativo instalado, mas não possui publicação nas lojas, notificações push ou rastreamento GPS em segundo plano. Também não há cobrança automática, upload nativo de vídeos nem integração com um profissional de nutrição. Mostre esses itens como possibilidades de evolução, sem prometer que já estão prontos.

Para entregar a um cliente, substitua banco, usuários, identidade, domínio e conteúdo de exemplo; homologue a experiência nos aparelhos usados pela academia. Contas de demonstração com senha pública nunca devem ser compartilhadas com um banco real.
