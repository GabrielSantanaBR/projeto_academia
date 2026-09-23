# Experiência integrada · decisões de produto

## Recursos disponíveis no piloto

| Área | Entrega | Limite conhecido |
| --- | --- | --- |
| Vídeos | Links autorizados de YouTube/Vimeo nos exercícios, visualizados sob demanda durante o treino | Sem uploads e sem catálogo de mídia próprio; disponibilidade depende do provedor e de permissão de incorporação |
| Corrida | GPS com início/pausa/continuação, distância recalculada no servidor, ritmo e mapa privado; exclusão pelo aluno | Funciona no navegador aberto em HTTPS, sem registro confiável com tela bloqueada, navegação ou sincronização com Strava |
| Comunidade | Publicar, comentar, curtir, ocultar e moderar dentro da mesma academia | Conteúdo textual, sem fotos e mensagens diretas; não compartilhar saúde, localização ou trajetos |
| Nutrição | Profissional individual, refeições e orientações com histórico de versões; leitura pelo aluno vinculado | Não gera dietas automaticamente e não substitui atendimento profissional; credenciais do nutricionista são conferidas pela academia |
| Professor | Vídeos no catálogo e no treino, resumo agregado das corridas do aluno, histórico e revisões existentes | Trajetos detalhados e orientações nutricionais não aparecem no painel do professor |

## Privacidade e implantação

- **Mapa:** o aluno autoriza a captura ao iniciar. Pontos GPS só são enviados ao servidor quando ele salva a atividade; a rota é acessível apenas em `/my-runs` pelo próprio aluno. O resumo sem coordenadas aparece no perfil que o professor responsável acompanha. Excluir a corrida remove a rota. Os blocos de mapa são solicitados ao OpenStreetMap na abertura e podem revelar ao serviço a região visualizada; mantenha a atribuição e acompanhe sua [política de uso](https://operations.osmfoundation.org/policies/tiles/) antes de aumentar o tráfego.
- **Alimentação:** o administrador vincula profissionais, sem acesso à descrição das refeições e orientações. O nutricionista acessa os seus alunos; ao trocar o vínculo, os planos anteriores ficam arquivados e deixam de ser o plano ativo do aluno. Confirme as obrigações de privacidade, finalidade, retenção, atendimento ao titular e identidade profissional antes de inserir dados reais. A [ANPD classifica dados referentes à saúde como sensíveis](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes).
- **Vídeo:** armazenamos somente URLs validadas, sem copiar arquivos. O embed só aparece após toque do usuário; siga as condições do [player oficial do YouTube](https://developers.google.com/youtube/player_parameters) e dos próprios autores.
- **GPS web:** a API de localização [exige contexto seguro e permissão explícita](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API). Teste em celular real com HTTPS e revise variação de sinal e suspensão pelo sistema operacional.

## Para operação de uma academia real

1. Faça backup recuperável antes da migration `20260923000000_connected_experience`, teste a restauração e aplique `npm run db:deploy` numa cópia isolada. A migration adiciona dados; não remove tabelas existentes.
2. Mantenha `DEMO_MODE=false` e `ALLOW_DEMO_SEED=false`. Configure profissionais, alunos, vínculos e links de vídeos validados pela equipe.
3. Homologue permissões com administrador, professor, nutricionista e aluno. Execute uma corrida real em HTTPS, veja o histórico e teste a exclusão; publique e modere um texto; troque o nutricionista de um aluno e confirme que seu plano antigo deixa de ser o vigente.
4. Defina responsáveis por moderação, prazos de resposta e suporte, bases legais, política de privacidade e prazos de conservação para percursos e orientações. Faça uma revisão jurídica e operacional antes da coleta de dados reais.

O piloto não foi validado como substituto de aplicativos nativos de corrida ou software clínico. A aprovação dos testes automatizados verifica os fluxos do código, não valida GPS em todos os aparelhos nem conformidade jurídica.
