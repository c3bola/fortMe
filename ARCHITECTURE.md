# Relatorio de Arquitetura

Este relatorio descreve a arquitetura atual do projeto `fortMe`, um bot Telegram em Node.js baseado em Telegraf, com persistencia principal em MySQL e resquicios de uma implementacao antiga baseada em JSON.

## 1. Estrutura de pastas

```text
.
|-- fortMe.js                    # Ponto de entrada da aplicacao
|-- package.json                 # Dependencias e metadados Node.js
|-- package-lock.json
|-- .env.example                 # Exemplo de variavel TELEGRAM_API_KEY
|-- commands/
|   |-- userCommands.js          # Agregador dos comandos de usuario
|   |-- adminCommands.js         # Agregador dos comandos administrativos
|   |-- user/
|   |   |-- fortme.js            # /fortme e callbacks de voto
|   |   |-- fortgirl.js          # /fortgirl e callbacks de voto
|   |   |-- jonesyme.js          # /jonesyme e callbacks de voto
|   |   |-- tryhardme.js         # /tryhardme
|   |   |-- x1.js                # /x1 e callbacks de duelo
|   |   |-- ranking.js           # /ranking
|   |   |-- x1stats.js           # /x1stats legado JSON
|   |   |-- help.js              # /help
|   |   |-- fortme_mysql.js      # Versao alternativa/legada nao carregada
|   |   |-- bkpjsonx1.js         # Backup legado do X1 em JSON
|   |-- admin/
|       |-- addAdmin.js          # /addAdmin e /rmAdmin
|       |-- botConfig.js         # /config e callbacks cmdt/cmd_info
|       |-- broadcast.js         # /broadcast e /broadcast_history
|       |-- list.js              # /list e callback remove_admin
|       |-- registerFortMe.js    # Registro legado em JSON
|       |-- registerFortGirl.js  # Registro legado em JSON
|       |-- registerFortJonesy.js# Registro legado em JSON
|       |-- registerTryhardImage.js # Atualiza config.json
|       |-- sendRank.js          # /sendrank
|       |-- rm.js                # Remocao administrativa
|       |-- manage*.js           # Gerenciadores com callbacks de navegacao
|       |-- *_old.js             # Versoes antigas/nao carregadas
|-- config/
|   |-- config.js                # Carrega .env e config.json
|   |-- config.json              # Admins, logGroup, flags e midias tryhard
|   |-- phrases.json             # Frases para rankings/duelos
|-- database/
|   |-- dbConnection.js          # Pool MySQL mysql2/promise
|   |-- fnbr_community.sql       # Schema SQL
|   |-- init_data.sql            # Dados iniciais
|   |-- json/                    # Dados e scripts da migracao JSON -> MySQL
|-- utils/
|   |-- databaseUtilsMySQL.js    # Camada principal de acesso ao banco
|   |-- databaseUtils.js         # Utilitario JSON legado
|   |-- broadcastUtils.js        # Registro automatico de grupos para broadcast
|   |-- logger.js                # Logger simples
|-- doc/
    |-- README.md
    |-- README_PT.md
    |-- LICENSE
```

## 2. Fluxo de inicializacao da aplicacao

1. `fortMe.js` importa `Telegraf`, `config/config`, agregadores de comandos, utilitarios de broadcast e `database/dbConnection`.
2. `config/config.js` carrega `.env`, le `config/config.json` e substitui `config.apiKey` por `process.env.TELEGRAM_API_KEY`.
3. `new Telegraf(config.apiKey)` cria a instancia do bot.
4. Middlewares globais sao registrados:
   - log de updates recebidos;
   - normalizacao de comandos com `@botname`;
   - registro automatico de grupos em `tb_bot_groups` quando uma mensagem de comando chega em grupo;
   - resposta generica para toda `callback_query` via `ctx.answerCbQuery()`.
5. `userCommands(bot)` registra comandos de usuario conforme flags em `config.commands`.
6. `adminCommands(bot)` carrega comandos administrativos listados no agregador.
7. `bot.catch`, `uncaughtException` e `unhandledRejection` registram erros.
8. Antes de abrir polling, `testConnection()` valida o pool MySQL.
9. Se a conexao funcionar, `bot.launch()` inicia o bot.
10. Em `SIGINT`/`SIGTERM`, `closePool()` fecha o pool e `bot.stop()` encerra o Telegraf.

## 3. Fluxo dos comandos Telegram

### Comandos de usuario carregados

- `/fortme`: sorteia uma imagem/conteudo da feature `1`.
- `/fortgirl`: sorteia uma imagem/conteudo da feature `2`.
- `/jonesyme`: sorteia uma imagem/conteudo da feature `3`.
- `/tryhardme`: gera percentual tryhard/banana da feature `4`.
- `/x1`: inicia duelo entre dois usuarios.
- `/help`: mostra ajuda.

Observacao: `config.commands` tambem possui `ranking` e `x1stats`, mas `commands/userCommands.js` nao carrega esses arquivos atualmente. Eles existem no repositorio, mas nao entram no boot principal pelo agregador atual.

### Fluxo de `/fortme`, `/fortgirl` e `/jonesyme`

1. Handler `bot.command(...)` recebe a mensagem.
2. Identifica usuario, grupo e data.
3. Garante cadastro do usuario com `ensureUser`.
4. Em privado:
   - busca conteudo aleatorio com `getRandomContent(featureId)`;
   - envia `replyWithPhoto` com `image_id` do Telegram;
   - nao grava uso diario.
5. Em grupo:
   - garante comunidade em `tb_community`;
   - registra grupo em `tb_bot_groups`;
   - verifica uso diario com `getDailyUsage`;
   - se ja usou, responde apontando para a mensagem anterior e mostra votos;
   - se nao usou, sorteia conteudo ativo em `tb_fortme_contents`;
   - envia foto com legenda e botoes inline de voto;
   - grava uso em `tb_fortme_daily_usage`.

### Fluxo de `/tryhardme`

1. Em privado, gera percentual aleatorio `0..100` e responde sem persistir.
2. Em grupo:
   - garante usuario, comunidade e grupo de broadcast;
   - verifica se o usuario ja usou a feature no dia via `checkDailyUsage`;
   - se ja usou, responde com o percentual salvo;
   - se nao usou, gera percentual, envia mensagem e grava `percentage_value` em `tb_fortme_daily_usage`.

### Fluxo de `/x1`

1. Exige que o comando seja resposta a uma mensagem ou uma `text_mention` resolvivel.
2. Se nao houver oponente, se desafiar a si mesmo, ou desafiar o bot, responde com frase tematica.
3. Calcula `duelKey` com os IDs ordenados dos jogadores.
4. Usa `activeDuels`, um `Map` em memoria, para impedir duelo duplicado entre os mesmos dois usuarios.
5. Garante usuarios no MySQL.
6. Cria registro de duelo com `createDuelRecord`.
7. Salva estatistica de duelo iniciado.
8. Envia mensagem com botoes inline `x1_attack_*`, `x1_defend_*`, `x1_flee_*`.
9. Cria timeout de 30 minutos para abandonar duelos incompletos.

### Comandos administrativos principais

- `/config`: lista features de `tb_fortme_features` e permite ativar/desativar via callback.
- `/addAdmin`, `/rmAdmin`: gerenciam admins/perfis.
- `/broadcast`, `/broadcast_history`: enviam mensagem a grupos ativos e gravam historico.
- `/sendrank`: envia rankings para grupos ativos.
- `/list`: lista admins, grupos, configuracoes e conteudos.
- `/registerFortMe`, `/registerFortGirl`, `/registerFortJonesy`: registram imagens em JSON legado.
- `/registerTryhardImage`: atualiza midias de tryhard/banana em `config/config.json`.
- `/manageFortGirls`, `/manageJonesy`, `/manager`: navegacao/ativacao/remocao de conteudos via callbacks.

## 4. Como callbacks sao processados

Todos os callbacks passam primeiro pelo middleware global em `fortMe.js`, que tenta executar `ctx.answerCbQuery()` para evitar loading infinito no Telegram. Depois, Telegraf encaminha para o primeiro `bot.action(...)` compativel.

Principais familias de callback:

- `fortme_(heart|hat)_{targetUserId}`:
  - usado por `/fortme`;
  - busca `tb_fortme_daily_usage` por `message_id`, `fk_group_id` e `featureId`;
  - grava/atualiza voto em `tb_fortme_votes`;
  - recalcula votos e atualiza o teclado inline.
- `fortgirl_(heart|hat)_{targetUserId}`:
  - mesmo fluxo da feature `2`.
- `jonesyme_(heart|hat)_{targetUserId}`:
  - mesmo fluxo da feature `3`.
- `x1_{action}_{duelKey}`:
  - localiza duelo em `activeDuels`;
  - valida se o usuario e um dos participantes;
  - salva a acao no objeto em memoria e em `tb_duel_moves`;
  - quando ambos escolhem, determina vencedor, atualiza estatisticas, atualiza duelo e envia resultado.
- `cmdt_{featureId}`:
  - alterna `is_active` em `tb_fortme_features`;
  - edita o teclado de configuracao.
- `cmd_info_{featureId}`:
  - mostra descricao da feature em alerta.
- `remove_admin_{adminId}`:
  - remove admin de `config.json`.
- `navigate_*`, `mgs_*`, `mgd_*`:
  - callbacks administrativos para navegar, alternar status ou remover itens/grupos.

## 5. Como o banco de dados e acessado

O acesso MySQL fica centralizado em `database/dbConnection.js`:

- usa `mysql2/promise`;
- cria `pool` com dados de `.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, limites de conexao e timezone `-03:00`;
- expoe `query(sql, params)`, `transaction(callback)`, `testConnection()` e `closePool()`;
- usa prepared statements via `pool.execute`.

A camada de dominio fica em `utils/databaseUtilsMySQL.js`, que encapsula operacoes como:

- usuarios: `ensureUser`, `updateUserMetadata`, `isAdmin`;
- grupos: `ensureCommunity`, `ensureBotGroup`, `getBroadcastGroups`;
- conteudos: `getRandomContent`, `addContent`, `removeContent`;
- uso diario: `getDailyUsage`, `recordDailyUsage`, `checkDailyUsage`, `saveDailyUsage`;
- votos: `recordVote`, `getVotes`;
- duelos: `createDuelRecord`, `saveDuelMove`, `updateDuelResult`, `saveX1Win`, `saveX1Statistics`;
- rankings e broadcast.

Ainda existe `utils/databaseUtils.js`, marcado como depreciado, com leitura/escrita de JSON para compatibilidade.

## 6. Principais entidades

- Usuario: representa o usuario do Telegram (`tb_user`) e seus metadados (`tb_data_user`).
- Perfil: define permissao basica, como `user` e `admin` (`tb_profile`).
- Grupo/Comunidade: grupos onde o bot opera (`tb_community`) e grupos elegiveis a broadcast (`tb_bot_groups`).
- Feature: comando/modulo funcional do bot, como `fortme`, `fortgirl`, `jonesyme`, `tryhardme`, `x1` (`tb_fortme_features`).
- Conteudo: imagem e legenda associadas a uma feature (`tb_fortme_contents`).
- Uso diario: registro de uso de uma feature por usuario e data (`tb_fortme_daily_usage`).
- Voto: voto `heart` ou `hat` em um uso diario (`tb_fortme_votes`).
- Duelo: desafio X1 entre dois usuarios, com status e vencedor.
- Movimento de duelo: acao escolhida por cada participante (`tb_duel_moves`).
- Estatistica de usuario: vitorias e contadores por grupo (`tb_fortme_user_stats`).
- Broadcast: historico de mensagens administrativas enviadas (`tb_broadcast_history`).

## 7. Principais tabelas

- `tb_profile`: perfis de usuario.
- `tb_user`: usuarios Telegram e perfil associado.
- `tb_metadata`, `tb_data_user`: metadados como `first_name`, `last_name`, `username`.
- `tb_community`: grupos/comunidades controlados pela aplicacao.
- `tb_bot_groups`: grupos ativos para broadcast e contagem de comandos.
- `tb_fortme_features`: catalogo de features/comandos e status `is_active`.
- `tb_fortme_contents`: conteudos sorteaveis por feature, com `image_id`, texto, nome e status.
- `tb_fortme_daily_usage`: uso diario por feature, usuario, data, mensagem e percentual tryhard.
- `tb_fortme_votes`: votos em conteudos diarios.
- `tb_fortme_user_stats`: estatisticas de X1/tryhard/banana por usuario e grupo.
- `tb_duel_moves`: movimentos individuais de duelos.
- `tb_broadcast_history`: historico de broadcasts.
- `fortme_duels` no SQL: tabela de duelos criada pelo schema.
- `tb_fortme_duels` no codigo: nome que o codigo tenta consultar/inserir. Esta divergencia precisa ser corrigida.

O schema tambem inclui tabelas futuras/adjacentes para suporte, wallet, raffles, assinaturas, bans, warns, welcome e parceiros, mas elas nao sao o centro dos comandos carregados atualmente.

## 8. Como imagens sao geradas

O bot nao gera imagens raster novas em runtime. Ele reutiliza `file_id` de midias ja enviadas ao Telegram:

1. Um admin responde a uma foto/midia com comando de cadastro.
2. O bot captura o `photo.file_id`, `animation.file_id` ou `video.file_id`.
3. Para os comandos ativos de usuario, as imagens esperadas ficam em `tb_fortme_contents.image_id`.
4. `/fortme`, `/fortgirl` e `/jonesyme` sorteiam um conteudo ativo com `ORDER BY RAND() LIMIT 1`.
5. O envio ocorre por `ctx.replyWithPhoto(content.image_id, ...)`.
6. Para tryhard/banana diario, `/sendrank tryhard` usa os `imageId`/`mediaType` guardados em `config.config.json` e envia com `sendPhoto`, `sendAnimation` ou `sendVideo`.

Ponto importante: os comandos administrativos `registerFortMe`, `registerFortGirl` e `registerFortJonesy` ainda gravam em arquivos JSON legados, nao em `tb_fortme_contents`. Para alimentar o fluxo MySQL atual, e necessario usar migracao ou criar/ajustar comandos que chamem `addContent`.

## 9. Dependencias importantes

- `telegraf`: framework Telegram Bot API.
- `mysql2`: driver MySQL com API Promise.
- `dotenv`: leitura de variaveis de ambiente.
- `express`: listado em `package.json`, mas nao foi encontrado uso ativo no codigo analisado.
- Node.js/CommonJS: todo o projeto usa `require`/`module.exports`.
- Telegram Bot API: envio de mensagens, fotos, videos, animacoes, callbacks e inline keyboards.

## 10. Pontos de extensao para novos modulos

Para criar uma nova feature no padrao atual:

1. Criar arquivo em `commands/user/novaFeature.js` ou `commands/admin/novaFeature.js`.
2. Exportar uma funcao `(bot) => { ... }`.
3. Registrar `bot.command('comando', handler)` e, se necessario, `bot.action(...)`.
4. Adicionar o `require` no agregador correto:
   - `commands/userCommands.js` para usuario;
   - `commands/adminCommands.js` para admin.
5. Criar entrada em `tb_fortme_features` e, se for usuario, em `config.commands` se continuar usando esse controle.
6. Para conteudo com imagens, gravar em `tb_fortme_contents` com `fk_id_features` da feature.
7. Usar `utils/databaseUtilsMySQL.js` para operacoes comuns.
8. Para callbacks, escolher prefixo unico de `callback_data` para evitar colisao.
9. Para comandos administrativos, padronizar a checagem de permissao usando `isAdmin` ou `checkAdminPermission`.
10. Para rankings ou jobs manuais, seguir o modelo de `sendRank.js`.

## Diagrama textual da arquitetura

```text
Telegram
   |
   v
Telegraf Bot (fortMe.js)
   |
   |-- Middlewares globais
   |     |-- log de updates
   |     |-- normalizacao /cmd@bot
   |     |-- registro de grupo para broadcast
   |     `-- answerCbQuery generico
   |
   |-- commands/userCommands.js
   |     |-- /fortme -> tb_fortme_contents, tb_fortme_daily_usage, tb_fortme_votes
   |     |-- /fortgirl -> tb_fortme_contents, tb_fortme_daily_usage, tb_fortme_votes
   |     |-- /jonesyme -> tb_fortme_contents, tb_fortme_daily_usage, tb_fortme_votes
   |     |-- /tryhardme -> tb_fortme_daily_usage
   |     `-- /x1 -> activeDuels Map + tabelas de duelo/stats
   |
   |-- commands/adminCommands.js
   |     |-- /config -> tb_fortme_features
   |     |-- /broadcast -> tb_bot_groups, tb_broadcast_history
   |     |-- /sendrank -> rankings agregados
   |     `-- registros/gerenciadores/admins
   |
   v
utils/databaseUtilsMySQL.js
   |
   v
database/dbConnection.js
   |
   v
MySQL fnbr_community
```

## Fluxo de uma mensagem recebida pelo bot

```text
1. Telegram entrega update ao Telegraf.
2. Middleware de log imprime tipo, chat, usuario e texto/callback.
3. Middleware normaliza /comando@NomeDoBot para /comando.
4. Se for comando em grupo, ensureGroupInBroadcast registra/atualiza tb_bot_groups.
5. Se for callback_query, middleware global chama answerCbQuery.
6. Telegraf roteia:
   - message text com "/" -> bot.command correspondente;
   - callback_query -> bot.action correspondente.
7. Handler executa validacoes, acessa MySQL e responde no Telegram.
8. Erros passam por try/catch local ou bot.catch global.
```

## Fluxo de geracao/envio de imagens

```text
Admin envia/reutiliza uma imagem no Telegram
   |
   v
Bot captura file_id
   |
   |-- Caminho legado: registerFortMe/registerFortGirl/registerFortJonesy -> JSON
   |-- Caminho esperado pelo runtime: tb_fortme_contents.image_id
   |
   v
Usuario chama /fortme, /fortgirl ou /jonesyme
   |
   v
getRandomContent(featureId) busca conteudo ativo no MySQL
   |
   v
ctx.replyWithPhoto(image_id, caption, inline_keyboard)
   |
   v
recordDailyUsage grava mensagem enviada
   |
   v
Callbacks de voto atualizam tb_fortme_votes e teclado inline
```

## Arquivos mais importantes do projeto

- `fortMe.js`: ponto de entrada, middlewares, carga de comandos, boot e shutdown.
- `commands/userCommands.js`: define quais comandos de usuario entram no bot.
- `commands/adminCommands.js`: define quais comandos administrativos entram no bot.
- `commands/user/fortme.js`: fluxo base de conteudo diario com voto.
- `commands/user/fortgirl.js`: fluxo semelhante ao FortMe, com remocao de imagem invalida.
- `commands/user/jonesyme.js`: fluxo semelhante ao FortMe.
- `commands/user/tryhardme.js`: percentual diario tryhard/banana.
- `commands/user/x1.js`: estado em memoria, callbacks e regras de duelo.
- `commands/admin/botConfig.js`: ativacao/desativacao de features no banco.
- `commands/admin/broadcast.js`: envio para grupos ativos.
- `commands/admin/sendRank.js`: rankings manuais para grupos.
- `utils/databaseUtilsMySQL.js`: camada de dominio do MySQL.
- `database/dbConnection.js`: conexao, query e transaction.
- `database/fnbr_community.sql`: schema.
- `database/init_data.sql`: dados iniciais fixos.
- `config/config.js` e `config/config.json`: configuracao carregada em runtime.

## Dividas tecnicas encontradas

- Divergencia critica de tabela de duelos: o schema cria `fortme_duels`, mas o codigo usa `tb_fortme_duels`.
- `tb_fortme_daily_usage` tem unique key em `(fk_id_features, fk_id_user, used_date)`, sem `fk_group_id`; isso pode impedir o mesmo usuario de usar a mesma feature em grupos diferentes no mesmo dia, embora o codigo trate o uso como por grupo.
- `commands/userCommands.js` nao carrega `/ranking` nem `/x1stats`, apesar de existirem arquivos e flags em `config.commands`.
- `x1stats.js` ainda le `database/dailyx1.json`, mas os JSON reais estao em `database/json/` e o X1 atual persiste em MySQL.
- Comandos de registro de imagens (`registerFortMe`, `registerFortGirl`, `registerFortJonesy`) escrevem JSON legado, enquanto os comandos de usuario leem `tb_fortme_contents`.
- Varias configuracoes estao duplicadas entre `config.json` e `tb_fortme_features`; `/config` altera o banco, mas `userCommands.js` decide carga inicial por `config.commands`.
- Alguns comandos administrativos usam `config.admins` em JSON, outros usam perfil MySQL (`fk_id_profile = 4` ou permissao equivalente), criando dois modelos de autorizacao.
- `express` esta em `package.json`, mas nao ha uso ativo observado.
- Ha codigo legado/backup carregavel no repositorio (`fortme_mysql.js`, `bkpjsonx1.js`, `broadcast_old.js`, `manager.js`/`manage*`) que aumenta ambiguidade operacional.
- `databaseUtilsMySQL.js` declara/exporta `saveDuelMove` duas vezes, o que pode mascarar implementacoes.
- `updateDuelStats` e chamado em `x1.js` com assinatura aparentemente incorreta em um ponto (`groupId, userId, userName, stats`), enquanto a funcao espera `(groupId, userId, stats)`.
- O middleware global responde callbacks antes dos handlers especificos; os handlers tambem chamam `answerCbQuery`, o que pode gerar erros ou comportamento redundante.
- Datas sao calculadas de formas diferentes: alguns comandos usam UTC-3 manual, outros `getCurrentDate`, outros `new Date().toISOString()`.
- O `.env.example` documenta apenas `TELEGRAM_API_KEY`, mas o runtime tambem depende de variaveis de banco (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, etc.).
- Ha textos com sinais de problema de encoding nos arquivos, indicando possivel mistura de codificacao.
