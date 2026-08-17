# Elementais — ETAPA 0: Análise e Proposta

> Relatório gerado em 2026-06-24
> Nenhum código foi implementado nesta etapa.

---

## 1. Análise da Arquitetura do Projeto

### 1.1 Tecnologias
- **Runtime:** Node.js
- **Framework Telegram:** Telegraf 4.x
- **Banco de Dados:** MySQL via `mysql2/promise` (pool de conexões)
- **Configuração:** `.env` + `config/config.json`

### 1.2 Ponto de Entrada
`fortMe.js` é o único bootstrap do bot. Registra middlewares globais e chama dois agregadores:
- `userCommands(bot)` — carrega comandos de usuário
- `adminCommands(bot)` — carrega comandos administrativos

### 1.3 Estrutura de Pastas Atual

```
fortMe.js                    # Bootstrap
config/
  config.js                  # Carrega .env + config.json
  config.json                # Admins, flags de comandos, mídias tryhard
commands/
  userCommands.js            # Agrega comandos de usuário (verifica flags)
  adminCommands.js           # Agrega comandos administrativos (sempre carrega)
  user/
    fortme.js  fortgirl.js  jonesyme.js  tryhardme.js  x1.js  ranking.js  help.js
  admin/
    addAdmin.js  botConfig.js  broadcast.js  list.js  manager.js
    manageFortGirls.js  manageJonesy.js  registerFortMe.js ...
utils/
  databaseUtilsMySQL.js      # Camada de domínio — todas as queries encapsuladas
  broadcastUtils.js          # Registro automático de grupos
  logger.js                  # Logger simples
database/
  dbConnection.js            # Pool MySQL: query(), transaction(), testConnection()
  fnbr_community.sql         # Schema completo
src/assets/images/Elementais/ # Imagens dos sprites
```

---

## 2. Padrões de Registro de Comandos

### Padrão User Command
```js
// Em userCommands.js
if (config.commands.elementais) {
  require('./user/elementais')(bot);
} else {
  bot.command('sprites', sendDisabledResponse);
  bot.command('elementais', sendDisabledResponse);
}

// Em commands/user/elementais.js
module.exports = (bot) => {
  bot.command('sprites', async (ctx) => { ... });
  bot.command('elementais', async (ctx) => { ... });
  bot.action(/elemental_(.+)/, async (ctx) => { ... });
};
```

### Padrão Admin Command
```js
// Em adminCommands.js
loadCommand('./admin/manageElementais');

// Em commands/admin/manageElementais.js
module.exports = (bot) => {
  bot.command('manageElementais', async (ctx) => { ... });
  bot.action(/navigate_elemental_\d+_(next|prev|toggle)/, async (ctx) => { ... });
};
```

### Flag em config.json (a adicionar)
```json
"commands": {
  ...
  "elementais": true
}
```

---

## 3. Padrão de Menus e Callbacks

### Nomeação de Callbacks
Padrão observado no projeto:

| Família | Exemplo | Uso |
|---|---|---|
| `fortme_{action}_{userId}` | `fortme_heart_123` | Votos |
| `fortgirl_{action}_{userId}` | `fortgirl_hat_456` | Votos |
| `x1_{action}_{duelKey}` | `x1_attack_123-456` | Duelos |
| `navigate_{feature}_{index}_{action}` | `navigate_fortgirl_0_next` | Navegação admin |
| `navigate_manager_{type}_{index}_{action}` | `navigate_manager_me_0_toggle` | Navegação manager |
| `cmdt_{featureId}` | `cmdt_2` | Toggle de feature |

**Proposta para Elementais:**
```
el_album_{userId}                    # Abrir álbum (menu de categorias)
el_cat_{categoryId}_{userId}         # Filtrar variantes por categoria
el_variant_{variantId}_{userId}      # Ver ficha de uma variante específica
el_toggle_{variantId}_{userId}       # Marcar/desmarcar variante na coleção
el_page_{categoryId}_{page}_{userId} # Paginação das variantes de uma categoria
el_back_{userId}                     # Voltar ao menu de categorias
navigate_elemental_{index}_{action}  # Admin: navegação de sprites/variantes
```

### Estrutura de Navegação
O projeto usa navegação por **índice inteiro** (0, 1, 2...) em listas ordenadas. Para o álbum, a navegação será por categoria e página, mantendo o userId para autenticidade do callback.

---

## 4. Padrão de Acesso ao Banco de Dados

### Camadas
1. **`database/dbConnection.js`** — pool MySQL
   - `query(sql, params)` — executa prepared statement
   - `transaction(callback)` — executa operação transacionada
   - `testConnection()` / `closePool()`

2. **`utils/databaseUtilsMySQL.js`** — domínio (única camada de negócio)
   - Funções nomeadas: `ensureUser`, `getRandomContent`, `getDailyUsage`, etc.
   - Exporta funções individuais, importadas por `require` nos comandos

### Funções Reutilizáveis para Elementais
- `ensureUser(userId, profileId, userData)` — garantir cadastro do usuário
- `ensureCommunity(groupId, groupName, type)` — garantir grupo cadastrado
- `ensureBotGroup(groupId, groupName)` — garantir grupo no broadcast
- `query(sql, params)` — acesso direto ao banco quando necessário

**As funções específicas de Elementais serão adicionadas no fim do arquivo `databaseUtilsMySQL.js`** seguindo exatamente o padrão JSDoc e organização em seções existente.

---

## 5. Análise das Imagens

### Localização
```
src/assets/images/Elementais/
```

### Padrão de Nomenclatura
```
{Categoria}_{Nome}.png
```

### Inventário Completo (54 sprites)

| Categoria | Sprites |
|---|---|
| **Base** (10) | Duck, Earth, Fire, Ghost, King, Punk, RedDemon, Sleepy, Water, ZeroPoint |
| **Candy** (10) | Duck, Earth, Fire, Ghost, King, Punk, RedDemo*, Sleepy, Water, ZeroPoint |
| **Cube** (2) | Punk, Sleepy |
| **Galaxy** (10) | Duck, Earth, Fire, Ghost, King, Punk, RedDemon, Sleepy, ZeroPoint + Gaglaxy_Water* |
| **Gem** (6) | Duck, Earth, Punk, RedDemon, Water, ZeroPoint |
| **Gold** (10) | Duck, Earth, Fire, Ghost, King, Punk, RedDemon, Sleepy, Water, ZeroPoint |
| **Holofoil** (5) | Duck, Fire, Ghost, King, Water |
| **Special** (1) | BurntPeanut |

> ⚠️ Typos confirmados nos filenames físicos: `Candy_RedDemo.png` (falta o 'n' — correto: `RedDemon`) e `Gaglaxy_Water.png` (letra extra — correto: `Galaxy_Water`). Confirmado pela análise dos demais arquivos: todas as outras categorias usam `RedDemon` e `Galaxy`. Os arquivos físicos permanecem intocados; o script de seed registrará os dados com os nomes corretos.

### Sprites Únicos (11 personagens)
Duck · Earth · Fire · Ghost · King · Punk · RedDemon · Sleepy · Water · ZeroPoint · BurntPeanut

### Mapeamento de Filename → Categoria

O prefixo do filename (`Base_`) não coincide com o `code` da categoria (`basic`). O seed fará o mapeamento:

| Prefixo no Filename | `code` (interno) | `name` (exibição) |
|---|---|---|
| Base | basic | Basic |
| Gold | gold | Gold |
| Candy | candy | Candy |
| Galaxy | galaxy | Galaxy |
| Gem | gem | Gem |
| Holofoil | holofoil | Holofoil |
| Cube | cube | Cube |
| Special | special | Special |

### Fonte de Dados
O script `database/seed_elementais.js` realizará a leitura do diretório uma única vez para popular o banco. Após o seed, o banco é a fonte oficial — novas variantes são inseridas diretamente no banco, sem depender do diretório de imagens.

---

## 6. Entidades Existentes Relevantes

| Tabela | Papel no Módulo Elementais |
|---|---|
| `tb_user` | Base para coleções e configurações |
| `tb_data_user` | Metadados (username, first_name) já disponíveis |
| `tb_bot_groups` | Referência para ranking por grupo |
| `tb_community` | Grupos com supervisão admin |
| `tb_fortme_features` | Nova feature `elementais` será registrada aqui |

---

## 7. Proposta de Modelagem do Banco de Dados (Revisada)

Modelagem normalizada em **7 tabelas**, aprovada após revisão. Estatísticas agregadas eliminadas — calculadas por SQL quando necessário.

Convenções seguidas:
- Prefixo `tb_`
- PK: `id_` + nome_da_tabela (sem `tb_`) + `INT AUTO_INCREMENT`
- FKs: prefixo `fk_` com índice `_idx`
- Engine: InnoDB, charset `utf8mb4_unicode_ci`
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### 7.1 `tb_elemental_rarity` — Raridades

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_rarity` (
  `id_elemental_rarity` INT         NOT NULL AUTO_INCREMENT,
  `name`                VARCHAR(50) NOT NULL COMMENT 'Nome de exibição: Common, Rare, Epic, Legendary',
  `color`               VARCHAR(7)  NULL DEFAULT NULL COMMENT 'Cor HEX para exibição: #FFFFFF',
  `display_order`       INT         NOT NULL DEFAULT 0,
  `created_at`          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_rarity`),
  UNIQUE INDEX `uk_elemental_rarity_name` (`name` ASC) VISIBLE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Raridades dos Sprites Elementais';
```

### 7.2 `tb_elemental_category` — Categorias

Permite adicionar novas categorias (Basic, Gold, Candy...) sem alterar código.

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_category` (
  `id_elemental_category` INT          NOT NULL AUTO_INCREMENT,
  `code`                  VARCHAR(50)  NOT NULL COMMENT 'Identificador interno: basic, gold, candy...',
  `name`                  VARCHAR(50)  NOT NULL COMMENT 'Nome de exibição: Basic, Gold, Candy...',
  `display_order`         INT          NOT NULL DEFAULT 0,
  `background_image`      VARCHAR(255) NULL DEFAULT NULL COMMENT 'Imagem de fundo da categoria',
  `is_active`             TINYINT      NOT NULL DEFAULT 1 COMMENT '1=ativo, 0=inativo',
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_category`),
  UNIQUE INDEX `uk_elemental_category_code` (`code` ASC) VISIBLE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Categorias dos Sprites (Basic, Gold, Candy, Galaxy, Gem, Holofoil, Cube, Special)';
```

### 7.3 `tb_elemental_sprite` — Sprites (personagens únicos)

Armazena apenas o personagem — independente de categoria e de atributos que variam por variante. Um sprite como "Duck" existe uma única vez, sem raridade ou custo próprios (esses vivem na variante).

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_sprite` (
  `id_elemental_sprite` INT         NOT NULL AUTO_INCREMENT,
  `slug`                VARCHAR(50) NOT NULL COMMENT 'Identificador url-safe: duck, zero-point, burnt-peanut',
  `name`                VARCHAR(50) NOT NULL COMMENT 'Nome de exibição: Duck, Zero Point, Burnt Peanut',
  `description`         TEXT        NULL DEFAULT NULL COMMENT 'Lore/descrição do personagem',
  `display_order`       INT         NOT NULL DEFAULT 0,
  `is_active`           TINYINT     NOT NULL DEFAULT 1 COMMENT '1=ativo, 0=inativo',
  `created_at`          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_sprite`),
  UNIQUE INDEX `uk_elemental_sprite_slug` (`slug` ASC) VISIBLE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Sprites Elementais — personagens únicos (Duck, Punk, Ghost...)';
```

> **Decisão de design:** `fk_id_rarity`, `drop_chance`, `summon_cost` e `location` foram movidos para `tb_elemental_variant`. Motivo: Basic Duck (Common, custo 1) e Galaxy Duck (Legendary, custo 10) são o mesmo personagem mas com atributos completamente distintos por variante.

### 7.4 `tb_elemental_variant` — Variantes (Sprite × Categoria)

Cada variante é uma combinação única de Sprite + Categoria (ex.: Candy Duck, Galaxy Punk). Um mesmo sprite pode ter N variantes, cada uma com sua própria raridade, custo, drop chance e localização.

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_variant` (
  `id_elemental_variant` INT          NOT NULL AUTO_INCREMENT,
  `fk_id_sprite`         INT          NOT NULL,
  `fk_id_category`       INT          NOT NULL,
  `fk_id_rarity`         INT          NULL DEFAULT NULL COMMENT 'Raridade específica desta variante',
  `location`             VARCHAR(255) NULL DEFAULT NULL COMMENT 'Como/onde obter esta variante',
  `summon_cost`          INT          NULL DEFAULT NULL COMMENT 'Custo de invocação desta variante',
  `drop_chance`          DECIMAL(5,2) NULL DEFAULT NULL COMMENT 'Chance de obtenção desta variante (%)',
  `image`                VARCHAR(255) NULL DEFAULT NULL COMMENT 'Imagem principal do sprite',
  `background_image`     VARCHAR(255) NULL DEFAULT NULL COMMENT 'Imagem de fundo do card',
  `card_image`           VARCHAR(255) NULL DEFAULT NULL COMMENT 'Imagem do card completo',
  `thumbnail_image`      VARCHAR(255) NULL DEFAULT NULL COMMENT 'Miniatura para listagens',
  `is_active`            TINYINT      NOT NULL DEFAULT 1 COMMENT '1=ativo, 0=inativo',
  `created_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_variant`),
  UNIQUE INDEX `uk_elemental_variant` (`fk_id_sprite` ASC, `fk_id_category` ASC) VISIBLE,
  INDEX `fk_elemental_variant_sprite_idx` (`fk_id_sprite` ASC) VISIBLE,
  INDEX `fk_elemental_variant_category_idx` (`fk_id_category` ASC) VISIBLE,
  INDEX `fk_elemental_variant_rarity_idx` (`fk_id_rarity` ASC) VISIBLE,
  CONSTRAINT `fk_elemental_variant_sprite`
    FOREIGN KEY (`fk_id_sprite`)
    REFERENCES `fnbr_community`.`tb_elemental_sprite` (`id_elemental_sprite`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_elemental_variant_category`
    FOREIGN KEY (`fk_id_category`)
    REFERENCES `fnbr_community`.`tb_elemental_category` (`id_elemental_category`)
    ON DELETE RESTRICT,
  CONSTRAINT `fk_elemental_variant_rarity`
    FOREIGN KEY (`fk_id_rarity`)
    REFERENCES `fnbr_community`.`tb_elemental_rarity` (`id_elemental_rarity`)
    ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Variantes: combinação de Sprite e Categoria (Candy Duck, Galaxy Punk...)';
```

### 7.5 `tb_elemental_collection` — Coleção do Usuário

Registra quais variantes cada usuário possui. Um usuário pode ter "Basic Duck" mas não "Galaxy Duck".

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_collection` (
  `id_elemental_collection` INT       NOT NULL AUTO_INCREMENT,
  `fk_id_user`              BIGINT    NOT NULL,
  `fk_id_variant`           INT       NOT NULL,
  `marked_at`               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Quando o usuário marcou como obtido',
  PRIMARY KEY (`id_elemental_collection`),
  UNIQUE INDEX `uk_elemental_collection` (`fk_id_user` ASC, `fk_id_variant` ASC) VISIBLE,
  INDEX `fk_elemental_collection_user_idx` (`fk_id_user` ASC) VISIBLE,
  INDEX `fk_elemental_collection_variant_idx` (`fk_id_variant` ASC) VISIBLE,
  CONSTRAINT `fk_elemental_collection_user`
    FOREIGN KEY (`fk_id_user`)
    REFERENCES `fnbr_community`.`tb_user` (`id_user`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_elemental_collection_variant`
    FOREIGN KEY (`fk_id_variant`)
    REFERENCES `fnbr_community`.`tb_elemental_variant` (`id_elemental_variant`)
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Coleção de variantes por usuário';
```

### 7.6 `tb_elemental_user_config` — Configurações do Usuário

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_user_config` (
  `id_elemental_user_config` INT     NOT NULL AUTO_INCREMENT,
  `fk_id_user`               BIGINT  NOT NULL,
  `accept_help_requests`     TINYINT NOT NULL DEFAULT 1 COMMENT '1=aceita pedidos de ajuda',
  `allow_private_messages`   TINYINT NOT NULL DEFAULT 1 COMMENT '1=aceita DMs',
  `allow_group_mention`      TINYINT NOT NULL DEFAULT 1 COMMENT '1=permite marcação no grupo',
  `created_at`               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_user_config`),
  UNIQUE INDEX `uk_elemental_user_config` (`fk_id_user` ASC) VISIBLE,
  INDEX `fk_elemental_user_config_user_idx` (`fk_id_user` ASC) VISIBLE,
  CONSTRAINT `fk_elemental_user_config_user`
    FOREIGN KEY (`fk_id_user`)
    REFERENCES `fnbr_community`.`tb_user` (`id_user`)
    ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Configurações do módulo Elementais por usuário';
```

### 7.7 `tb_elemental_help_log` — Registro de Ajudas

Referencia a variante (não o sprite genérico) para auditoria precisa da ajuda.

```sql
CREATE TABLE IF NOT EXISTS `fnbr_community`.`tb_elemental_help_log` (
  `id_elemental_help_log` INT          NOT NULL AUTO_INCREMENT,
  `fk_helper_id`          BIGINT       NOT NULL COMMENT 'Usuário que ajudou',
  `fk_helped_id`          BIGINT       NOT NULL COMMENT 'Usuário que foi ajudado',
  `fk_group_id`           BIGINT       NOT NULL,
  `fk_id_variant`         INT          NOT NULL COMMENT 'Variante que motivou a ajuda',
  `note`                  VARCHAR(255) NULL DEFAULT NULL COMMENT 'Observação opcional',
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_help_log`),
  INDEX `fk_elemental_help_helper_idx` (`fk_helper_id` ASC) VISIBLE,
  INDEX `fk_elemental_help_helped_idx` (`fk_helped_id` ASC) VISIBLE,
  INDEX `fk_elemental_help_group_idx` (`fk_group_id` ASC) VISIBLE,
  INDEX `fk_elemental_help_variant_idx` (`fk_id_variant` ASC) VISIBLE,
  CONSTRAINT `fk_elemental_help_helper`
    FOREIGN KEY (`fk_helper_id`)
    REFERENCES `fnbr_community`.`tb_user` (`id_user`),
  CONSTRAINT `fk_elemental_help_helped`
    FOREIGN KEY (`fk_helped_id`)
    REFERENCES `fnbr_community`.`tb_user` (`id_user`),
  CONSTRAINT `fk_elemental_help_group`
    FOREIGN KEY (`fk_group_id`)
    REFERENCES `fnbr_community`.`tb_bot_groups` (`group_id`)
    ON DELETE NO ACTION,
  CONSTRAINT `fk_elemental_help_variant`
    FOREIGN KEY (`fk_id_variant`)
    REFERENCES `fnbr_community`.`tb_elemental_variant` (`id_elemental_variant`)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'Log de ajudas entre colecionadores';
```

### 7.8 Diagrama de Relacionamento

```
tb_elemental_rarity ◄──────────────────────────── tb_elemental_variant ───► tb_elemental_category
                                                           ▲
                                               tb_elemental_sprite
                                          (personagem puro: duck, punk...)

tb_user ──────────┬──── tb_elemental_collection ──► tb_elemental_variant
                  ├──── tb_elemental_user_config
                  ├──── tb_elemental_help_log ─────► tb_elemental_variant
                  └──── tb_elemental_help_log ─────► tb_bot_groups
```

> **Nota:** A raridade conecta-se agora à variante (não ao sprite). Isso permite que Basic Duck seja Common e Galaxy Duck seja Legendary — duas variantes do mesmo personagem com raridades independentes.

### 7.9 Estatísticas — Calculadas via SQL (sem tabela de stats)

A tabela `tb_elemental_user_stats` foi removida. Toda agregação ocorre em tempo de consulta:

```sql
-- Progresso do usuário
SELECT
  COUNT(*) AS total_owned,
  (SELECT COUNT(*) FROM tb_elemental_variant WHERE is_active = 1) AS total_available
FROM tb_elemental_collection
WHERE fk_id_user = ?;

-- Ranking de colecionadores (por grupo de contexto — filtra por usuários do grupo)
SELECT c.fk_id_user, COUNT(*) AS total_variants
FROM tb_elemental_collection c
GROUP BY c.fk_id_user
ORDER BY total_variants DESC
LIMIT 10;

-- Ranking de guardiões (mais ajudaram em um grupo)
SELECT fk_helper_id, COUNT(*) AS total_helped
FROM tb_elemental_help_log
WHERE fk_group_id = ?
GROUP BY fk_helper_id
ORDER BY total_helped DESC
LIMIT 10;
```

---

## 7.10 Revisão Crítica — Decisões de Arquitetura

Revisão realizada antes da ETAPA 1. Cada decisão está justificada abaixo.

| Decisão | Justificativa |
|---|---|
| `fk_id_rarity`, `drop_chance`, `summon_cost`, `location` movidos do sprite para a variante | Basic Duck e Galaxy Duck são o mesmo personagem com atributos completamente distintos. Manter no sprite impediria raridades e custos por variante — limitação estrutural desde o início. |
| `obtained_at` renomeado para `marked_at` | O usuário "marca" que possui no bot, não o "obtém". Semântica correta evita confusão futura no código. |
| `addVariantToCollection` e `removeVariantFromCollection` removidos da API | `toggleVariantInCollection` cobre ambas as operações. Superfície desnecessária. |
| `/ranking elementais` será adicionado ao `ranking.js` existente | Registrar `bot.command('ranking')` em dois arquivos causa conflito silencioso no Telegraf. O arquivo existente usa `args[1]` para subtipo — extensão direta. |
| Soft delete na coleção (`removed_at`) não implementado agora | Inconsistente com o padrão do projeto (hard deletes). Dívida técnica registrada — pode ser adicionado depois com `ALTER TABLE`, sem breaking changes. |
| `tb_elemental_user_config` mantida | Simples e barata. Os defaults (tudo = 1) garantem comportamento correto antes de qualquer `/configsprites`. |
| Ranking de colecionadores é global | A coleção não tem `fk_group_id` por design correto. O bot não rastreia membros por grupo. Limitação documentada — o ranking exibirá top global. |
| Feature registrada em `tb_fortme_features` | Permite ao admin `/config` ativar/desativar o módulo inteiro sem tocar em código. |

---

## 8. Proposta de Arquitetura do Módulo

O módulo seguirá **exatamente o padrão existente**: sem camadas extras, sem services/repositories separados. As funções de banco ficam em `databaseUtilsMySQL.js` e os comandos em `commands/user/` e `commands/admin/`.

### 8.1 Arquivos a Criar

```
commands/
  user/
    elementais.js          # /sprites, /elementais — álbum digital + callbacks de navegação
    colecao.js             # /colecao, /estatisticas, /perfil, /configsprites
    sprite.js              # /sprite <nome> — ficha da variante + botões marcar/desmarcar
    elementaisRanking.js   # /ranking (sprites), /guardioes, /diario
    ajuda.js               # /ajuda, /comparar, /agradecer
  admin/
    manageElementais.js    # /manageElementais — navegação e gestão de sprites/variantes
database/
  seed_elementais.js       # Seed inicial: raridades, categorias, sprites e variantes
```

### 8.2 Arquivos a Modificar

| Arquivo | Alteração |
|---|---|
| `commands/userCommands.js` | Adicionar bloco de carregamento para cada comando Elementais |
| `commands/adminCommands.js` | Adicionar `loadCommand('./admin/manageElementais')` |
| `config/config.json` | Adicionar flag `"elementais": true` em `commands` |
| `utils/databaseUtilsMySQL.js` | Adicionar seção `ELEMENTAIS` com todas as funções de domínio |
| `database/fnbr_community.sql` | Adicionar as 7 novas tabelas ao final |
| `commands/user/ranking.js` | Adicionar `else if (feature === 'elementais')` para o subtipo |
| `commands/user/help.js` | Adicionar novos comandos à mensagem de ajuda |

### 8.3 Funções de Domínio a Adicionar em `databaseUtilsMySQL.js`

```
// CATÁLOGO — Raridades e Categorias
getElementalRarities()                       // Lista todas as raridades
getElementalCategories()                     // Lista categorias ativas (por display_order)
getCategoryByCode(code)                      // Busca categoria pelo código interno

// SPRITES — Personagens
getSpriteBySlug(slug)                        // Busca sprite por slug (ex: "duck")
getSpriteById(spriteId)                      // Busca sprite por ID
getAllSprites()                              // Lista todos os sprites ativos

// VARIANTES
getVariantsBySpriteId(spriteId)              // Variantes de um sprite (join categoria)
getVariantById(variantId)                    // Variante por ID (join sprite + categoria)
getVariantsByCategory(categoryId)            // Lista variantes de uma categoria
getVariantMembersCount(variantId)            // Quantos usuários possuem a variante
getAllVariants()                             // Todas as variantes ativas (join completo)

// COLEÇÃO — Usuário
getUserCollection(userId)                    // Todas as variantes do usuário (join completo)
getUserCollectionIds(userId)                 // Apenas IDs de variantes (checagem rápida)
toggleVariantInCollection(userId, variantId) // Marcar/desmarcar variante (INSERT ou DELETE)
hasVariantInCollection(userId, variantId)    // Verifica se possui a variante

// CONFIGURAÇÕES — Usuário
getUserElementalConfig(userId)               // Busca ou cria configuração padrão
updateUserElementalConfig(userId, data)      // Atualiza configuração

// AJUDAS
recordHelp(helperId, helpedId, groupId, variantId, note) // Registra ajuda
getTopHelpers(groupId, limit)               // Ranking de guardiões do grupo

// ESTATÍSTICAS — via SQL, sem tabela de stats
getUserCollectionProgress(userId)           // { total_owned, total_available, percentage }
getCollectionRanking(groupId, limit)        // Ranking de colecionadores por variantes
getRecentActivity(groupId, limit)           // Últimas atividades no grupo
```

### 8.4 Fluxo do Comando `/sprites` (Álbum)

```
/sprites ou /elementais
  │
  ├─ privado e grupo (ambos suportados)
  │
  ▼
ensureUser()
  │
  ▼
getElementalCategories()   ← lê do banco (populado pelo seed inicial)
  │
  ▼
Mensagem: "📚 Álbum de Sprites" + botões de categoria
  [Basic ●●●●●] [Candy ●●●] [Gold ●●○○]
  [Galaxy ●○○] [Gem ●●] [Holofoil ○○]
  [Cube ○○] [Special ○]
  │
  └─ Callback: el_cat_{categoryId}_{userId}
       │
       ▼
     getUserCollectionIds(userId)      ← IDs de variantes
     getVariantsByCategory(categoryId) ← variantes com join sprite
       │
       ▼
     Lista de variantes com ✅/⬜ + navegação por página
     [⬅️] Sprite 1-8 de 10 [➡️]
       │
       └─ Callback: el_toggle_{variantId}_{userId}
            toggleVariantInCollection()
```

### 8.5 Fluxo do Comando `/sprite <nome>` (Ficha)

```
/sprite Duck  (em grupo)
  │
  ▼
getSpriteBySlug(slug) ou busca por name LIKE em tb_elemental_sprite
  │
  ▼
Se sprite tem múltiplas variantes ativas: listar por categoria
  [Basic] [Gold] [Candy] [Galaxy]...
  │
  ▼
Ficha completa da variante selecionada:
  imagem + nome sprite + categoria + raridade + demais campos do sprite
Botões: [✅ Marcar] ou [❌ Remover] dependendo da coleção do usuário
```

---

## 9. Mapeamento de Comandos × Arquivos

| Comando | Arquivo | Contexto |
|---|---|---|
| `/sprites`, `/elementais` | `commands/user/elementais.js` | Privado e Grupo |
| `/colecao` | `commands/user/colecao.js` | Privado e Grupo |
| `/estatisticas` | `commands/user/colecao.js` | Privado e Grupo |
| `/configsprites` | `commands/user/colecao.js` | Privado |
| `/perfil` | `commands/user/colecao.js` | Privado e Grupo |
| `/sprite <nome>` | `commands/user/sprite.js` | Grupo |
| `/ranking` (sprites) | `commands/user/elementaisRanking.js` | Grupo |
| `/guardioes` | `commands/user/elementaisRanking.js` | Grupo |
| `/diario` | `commands/user/elementaisRanking.js` | Grupo |
| `/ajuda` | `commands/user/ajuda.js` | Grupo |
| `/comparar` | `commands/user/ajuda.js` | Grupo |
| `/agradecer <sprite>` | `commands/user/ajuda.js` | Grupo (reply) |
| `/manageElementais` | `commands/admin/manageElementais.js` | Admin |

---

## 10. Pontos de Atenção

1. **Typos confirmados nos filenames:** `Candy_RedDemo.png` (falta o 'n', correto: `RedDemon`) e `Gaglaxy_Water.png` (letra extra, correto: `Galaxy_Water`). Confirmado por cruzamento com demais arquivos — todas as outras categorias usam `RedDemon` e `Galaxy`. O script de seed registrará as variantes com os dados corretos; os filenames físicos permanecem intocados e são referenciados como estão no campo `image`.

2. **`/ranking` deve ser estendido, não duplicado:** O `ranking.js` já registra `bot.command('ranking', ...)` e usa `feature = args[1]` para desviar por subtipo. Criar um novo arquivo com `bot.command('ranking', ...)` geraria conflito silencioso (Telegraf registra ambos, apenas o primeiro responde). A solução correta é adicionar `else if (feature === 'elementais')` dentro do `ranking.js` existente. O arquivo `elementaisRanking.js` existirá apenas para encapsular as funções dos comandos `/guardioes` e `/diario`, que são exclusivos. A lógica do `/ranking elementais` será adicionada no `ranking.js` existente na ETAPA 7.

   **Limitação de ranking por grupo:** A coleção não tem `fk_group_id` — ela é global por design. O ranking de colecionadores exibirá os maiores colecionadores do bot inteiro, não filtrado por membros do grupo. Isso deve ser documentado nas respostas do comando.

3. **Banco como fonte de verdade:** O script `database/seed_elementais.js` fará a leitura única do filesystem para popular o banco na ETAPA 1. Após o seed, novas variantes/sprites são adicionados diretamente no banco — o diretório de imagens não é mais consultado em runtime.

4. **Callbacks únicos:** Todos os callbacks do módulo Elementais usarão prefixo `el_` para evitar colisão com callbacks existentes (`fortme_`, `x1_`, `navigate_`, `cmdt_`).

5. **feature_id:** A feature `elementais` deve ser registrada em `tb_fortme_features` com um novo ID (provavelmente 6), sem quebrar as features existentes (1-5).

6. **`/agradecer` vs `/ranking`:** O comando `/agradecer` cria conflito semântico com o módulo X1 existente. Será implementado como novo comando exclusivo do módulo Elementais.

---

## 11. Resumo das Etapas Planejadas

| Etapa | Escopo |
|---|---|
| **ETAPA 1** | 7 novas tabelas SQL + script de seed (`seed_elementais.js`) + seção Elementais em `databaseUtilsMySQL.js` |
| **ETAPA 2** | Estrutura dos arquivos de comando (esqueletos) + registro nos agregadores |
| **ETAPA 3** | `/sprites` e `/elementais` — álbum com categorias e navegação |
| **ETAPA 4** | Marcar/desmarcar sprites — persistência da coleção |
| **ETAPA 5** | `/sprite <nome>` — ficha completa do sprite |
| **ETAPA 6** | `/colecao`, `/estatisticas`, `/perfil`, `/configsprites` |
| **ETAPA 7** | `/ajuda`, `/comparar`, `/agradecer`, `/guardioes`, `/diario`, `/ranking` (sprites) |
| **ETAPA 8** | Revisão geral, limpeza e documentação final |

---

*Nenhum código foi escrito. Aguardando autorização para iniciar a ETAPA 1.*
