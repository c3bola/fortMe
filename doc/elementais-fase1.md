# ETAPA 1 — Banco de Dados e Camada de Dados

**Status:** ✅ Concluída  
**Data:** 2025  
**Arquivos modificados/criados:** 3

---

## O que foi implementado

### A) `database/fnbr_community.sql` — 7 novas tabelas

Inseridas antes das linhas finais `SET SQL_MODE/FOREIGN_KEY_CHECKS/UNIQUE_CHECKS`.  
Dependências respeitadas na ordem de criação:

| Tabela | Depende de |
|---|---|
| `tb_elemental_rarity` | — |
| `tb_elemental_category` | — |
| `tb_elemental_sprite` | — |
| `tb_elemental_variant` | sprite, category, rarity |
| `tb_elemental_collection` | user, variant |
| `tb_elemental_user_config` | user |
| `tb_elemental_help_log` | user, bot_groups, variant |

**Decisões de design:**
- `fk_id_rarity` em `tb_elemental_variant` é nullable — raridades atribuídas manualmente depois do seed
- `marked_at` em `tb_elemental_collection` (não `obtained_at`) — semântica correta: o usuário *marca* no bot
- `tb_elemental_user_stats` **removida** do escopo — todas as estatísticas calculadas via SQL on demand
- FK `fk_elemental_help_group` usa `ON DELETE NO ACTION` — logs históricos devem ser preservados

---

### B) `utils/databaseUtilsMySQL.js` — seção ELEMENTAIS

Adicionada antes de `module.exports`. Segue os padrões existentes:
- Banner de seção `// =====================================================`
- JSDoc com `@param` e `@returns`
- try/catch com `console.error('[DB] ...')`
- SQL raw com prepared statements via `query(sql, params)`

**22 novas funções exportadas:**

| Função | Finalidade |
|---|---|
| `getElementalRarities()` | Lista raridades ordenadas |
| `getElementalCategories()` | Lista categorias ativas |
| `getCategoryByCode(code)` | Categoria por código interno |
| `getSpriteBySlug(slug)` | Sprite por slug url-safe |
| `getSpriteById(id)` | Sprite por ID |
| `getAllSprites()` | Todos os sprites ativos |
| `getVariantsBySpriteId(id)` | Variantes de um sprite |
| `getVariantById(id)` | Variante com join completo |
| `getVariantsByCategory(id)` | Variantes de uma categoria |
| `getVariantMembersCount(id)` | Quantos usuários possuem a variante |
| `getAllVariants()` | Todas as variantes ativas |
| `getUserCollection(userId)` | Coleção completa do usuário |
| `getUserCollectionIds(userId)` | Set de IDs (checagem rápida) |
| `hasVariantInCollection(userId, variantId)` | Verifica posse de variante |
| `toggleVariantInCollection(userId, variantId)` | Marca/desmarca variante |
| `getUserElementalConfig(userId)` | Config do módulo (cria se não existe) |
| `updateUserElementalConfig(userId, data)` | Atualiza config |
| `recordHelp(helperId, helpedId, groupId, variantId, note)` | Log de ajuda |
| `getTopHelpers(groupId, limit)` | Ranking de guardiões |
| `getUserCollectionProgress(userId)` | Progresso: owned/total/% |
| `getCollectionRanking(limit)` | Ranking global de colecionadores |
| `getRecentActivity(groupId, limit)` | Últimas marcações de usuários do grupo |

**Nota:** `updateDuelStats` no módulo.exports teve a vírgula final corrigida ao adicionar as novas entradas.

---

### C) `database/seed_elementais.js` — script de carga inicial

Script Node.js standalone executado com `node database/seed_elementais.js`.

**O que o seed faz:**
1. Conecta ao banco via `dbConnection.js`
2. Lê `src/assets/images/Elementais/` e parseia 54 PNGs
3. Normaliza typos de arquivo sem renomear os arquivos físicos:
   - `Candy_RedDemo.png` → sprite "Red Demon" (slug `red-demon`)
   - `Gaglaxy_Water.png` → categoria Galaxy, sprite "Water"
4. Insere 5 raridades (Common, Uncommon, Rare, Epic, Legendary)
5. Insere 8 categorias (Basic, Gold, Candy, Galaxy, Gem, Holofoil, Cube, Special)
6. Insere sprites únicos com slug e display_order alfabético
7. Insere 54 variantes com `image = 'Elementais/{filename}'`
8. Registra `elementais` em `tb_fortme_features`
9. Exibe totais finais

**IDEMPOTENTE** — cada inserção verifica existência antes de inserir. Pode ser re-executado com segurança.

---

## Revisão crítica pós-implementação (2025-06-24)

### Correções aplicadas

**1. `database/fnbr_community.sql` — FK sem ON DELETE em `tb_elemental_help_log`**

`fk_helper_id` e `fk_helped_id` estavam sem cláusula `ON DELETE`, o que resulta em `RESTRICT` implícito.
Isso impedia deletar um usuário que tivesse entradas no log de ajudas — inconsistente com `tb_elemental_collection`
onde a FK de usuário usa `ON DELETE CASCADE`.

**Correção:** Adicionado `ON DELETE CASCADE` em ambos os FKs de usuário do help_log.

---

**2. `database/seed_elementais.js` — Variante existente era ignorada no re-run**

O seed fazia `continue` ao encontrar variante existente, nunca atualizando o campo `image`.
O campo `image` é derivado diretamente do nome do arquivo em disco e deve refletir o estado atual
(ex: correção de typo de filename → arquivo renomeado → `image` desatualizado).

**Correção:** Para variantes existentes, o seed agora:
- Compara o `image` atual com o caminho em disco
- Atualiza apenas o campo `image` se estiver diferente
- **Preserva todos os outros campos** (`location`, `summon_cost`, `drop_chance`, `fk_id_rarity`, etc.)

---

### Análise — Funções (22)

Nenhuma duplicação de responsabilidade encontrada. Nenhuma reutilização possível com funções existentes do projeto.
Nenhuma lógica de negócio antecipada — todas as 22 funções são pura camada de acesso a dados.

Funções usadas na ETAPA 2: **nenhuma** (ETAPA 2 = esqueleto de comandos + feature flag).

---



Criar os arquivos de comando esqueleto e registrá-los nos agregadores:

- `commands/user/elementais.js` — stub vazio
- `commands/admin/manageElementais.js` — stub vazio
- Adicionar `"elementais": true` em `config/config.json`
- Registrar em `commands/userCommands.js` (com guard de feature flag)
- Registrar em `commands/adminCommands.js`

**Aguardando autorização para ETAPA 2.**
