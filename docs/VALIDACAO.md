# Validação da versão 0.2

Em 13/09/2026, o commit `cb4bc627facb54e4e70eeed452982bae7b523e21` passou pela [execução completa no GitHub Actions](https://github.com/GabrielSantanaBR/projeto_academia/actions/runs/34779564859).

| Verificação | Resultado observado |
| --- | --- |
| Instalação pelo lockfile e geração do Prisma Client | Aprovadas |
| Duas migrations aplicadas em PostgreSQL 16 | Aprovadas |
| ESLint e TypeScript | Sem erros |
| Testes de domínio | 18 aprovados |
| Integração de operações e autenticação com banco real | 10 aprovados |
| Compilação de produção Next.js | Aprovada |
| Fluxo completo no Chromium, desktop 1440 × 1000 | Aprovado |
| Mesmo fluxo em emulação móvel Pixel 7 | Aprovado |
| Blueprint Render contra o JSON Schema oficial | Válido |

## O que o navegador executou

O teste entra com o administrador e cadastra um professor e um aluno, sem acesso direto ao banco para essas operações. Configura nome/cidade/cor da academia e verifica o CSV. Entra como professor, troca a senha temporária, cria um modelo, atribui ao aluno e publica uma revisão personalizada. Entra como aluno, troca a senha temporária, registra uma série, salva, recarrega a página, confere os valores persistidos e finaliza.

No histórico, verifica tanto a série executada quanto a indicação de série não realizada. Confirma o bloqueio da exportação para professor/aluno, o redirecionamento do aluno ao tentar entrar no painel e o logout. Verifica ausência de erros JavaScript e de rolagem horizontal do documento nas telas avaliadas.

## Limites da evidência

- Banco, nomes e contas dos testes são fictícios e descartáveis.
- A integração verifica isolamento entre academias e permissões; não é uma auditoria externa de segurança.
- A revisão visual usa capturas das telas testadas. A emulação móvel não substitui homologação em aparelhos reais, Safari ou Firefox.
- Não foram executados teste de carga, importação de uma base de cliente, deploy em uma conta Render ou restauração de backup de produção.
- Domínio, custos, configuração inicial, backup e aceite da academia continuam sendo atividades da implantação descrita no roteiro de cinco dias.

Mudanças posteriores devem manter o workflow aprovado. O status atual é consultável na aba Actions; este registro identifica a execução que sustenta a validação acima.
