# ETAPA 4 — Marcar/Desmarcar Sprites — Persistência da Coleção

**Status:** ✅ Concluída  
**Data:** 2026-06-24

---

## Arquivos modificados

| Arquivo | Tipo | Alteração |
|---|---|---|
| `commands/user/elementais.js` | Modificado | Implementação do toggle de coleção + indicadores visuais de posse |

---

## O que foi implementado

### 1. Indicador visual de posse na lista de sprites (`sendSpriteList`)

A função `sendSpriteList` recebe agora o `userId` como quarto parâmetro. Com ele, chama `getUserCollectionIds(userId)` uma única vez por requisição para obter um `Set<number>` com os IDs de variantes que o usuário possui.

Cada botão da lista agora exibe:
- `✅ Duck` — se o usuário possui a variante
- `⬜ Duck` — se o usuário não possui a variante

O cabeçalho da lista também foi atualizado:

```
⚪ Basic
10 sprite(s) — 3 na sua coleção
```

O `userId` é propagado corretamente pelo callback `el_cat_{id}`, que o extrai de `ctx.from.id`.

---

### 2. Botão de toggle na ficha da variante (`el_var_{id}`)

O handler `el_var_{id}` agora faz duas consultas em paralelo via `Promise.all`:
- `getVariantById(variantId)` — dados da variante
- `hasVariantInCollection(userId, variantId)` — estado de posse do usuário

Com base no resultado, o botão exibido na ficha é:
- `✅ Tenho este sprite!` — se o usuário **não possui** (ação: marcar)
- `❌ Remover da coleção` — se o usuário **já possui** (ação: desmarcar)

O teclado da ficha passou de 1 linha para 2 linhas:
```
[ ✅ Tenho este sprite! ]
[ ⬅️ Basic              ]
```

---

### 3. Handler `el_toggle_{variantId}` (substituiu stub)

Callback implementado que:

1. Busca a variante via `getVariantById(variantId)`
2. Chama `toggleVariantInCollection(userId, variantId)` — INSERT ou DELETE atômico na `tb_elemental_collection`
3. Exibe **toast** imediato (`answerCbQuery` sem `show_alert`):
   - `✅ Duck adicionado à sua coleção!`
   - `❌ Duck removido da sua coleção.`
4. Remonta a caption/texto da ficha com os mesmos dados (sem nova consulta ao banco — variant já foi buscada)
5. Atualiza o botão para refletir o novo estado
6. Edita a mensagem existente em vez de reenviar:
   - Mensagem de **foto** → `ctx.editMessageCaption()` (edita legenda + teclado)
   - Mensagem de **texto** → `ctx.editMessageText()` (edita texto + teclado)

---

## Decisões técnicas

### Toast sem `show_alert`

O feedback de toggle usa `answerCbQuery(msg, { show_alert: false })` — aparece como notificação discreta no topo da tela em vez de um alerta modal. Motivo: o usuário vê o botão mudar ao mesmo tempo, o alerta seria redundante e intrusivo.

### `editMessageCaption` vs `editMessageText`

A Telegram API não permite editar uma mensagem de mídia com `editMessageText`. Quando a ficha está sendo exibida como foto (caso mais comum — 53 das 54 variantes têm imagem em disco), é necessário usar `editMessageCaption`. A detecção é feita via `ctx.callbackQuery?.message?.photo`, seguindo o mesmo padrão já estabelecido na ETAPA 3.

### Sem segunda consulta ao banco no toggle

O handler `el_toggle` busca a variante com `getVariantById` uma única vez para montar a caption. Não chama `hasVariantInCollection` depois — o estado atual (`nowOwned`) vem diretamente do retorno de `toggleVariantInCollection` (`true` = adicionou, `false` = removeu). Evita uma query desnecessária.

### `getUserCollectionIds` retorna `Set<number>`

Usado em `sendSpriteList` para checagem O(1) de posse por variante. Uma única query para N variantes. Padrão definido na ETAPA 1.

### `sendSpriteList` recebe `userId` como parâmetro opcional

O quarto parâmetro `userId` é opcional — se `null` ou `undefined`, `ownedIds` é um `Set()` vazio e os indicadores exibem `⬜` para todos. Isso mantém retrocompatibilidade caso o handler seja chamado sem usuário autenticado (improvável no Telegram, mas seguro por design).

---

## Fluxo completo da ETAPA 4

```
/elementais
    │
    ▼
Menu de categorias (sem mudança)
    │  el_cat_{id}
    ▼
Lista de sprites com ✅/⬜ e contador na legenda
    │  el_var_{id}
    ▼
Ficha da variante
  [✅ Tenho este sprite!]   ← se não possui
  [⬅️ Basic              ]
    │  el_toggle_{variantId}
    ▼
Toast: "✅ Duck adicionado à sua coleção!"
Ficha atualizada:
  [❌ Remover da coleção]   ← estado invertido, sem recarregar a foto
  [⬅️ Basic             ]
```

---

## Funções do banco utilizadas nesta etapa

| Função | Origem | Uso |
|---|---|---|
| `getUserCollectionIds(userId)` | ETAPA 1 | Lista de sprites da categoria com indicador ✅/⬜ |
| `hasVariantInCollection(userId, variantId)` | ETAPA 1 | Estado inicial na abertura da ficha (`el_var`) |
| `toggleVariantInCollection(userId, variantId)` | ETAPA 1 | Alterna posse e retorna novo estado (`el_toggle`) |
| `getVariantById(variantId)` | ETAPA 1 | Dados da variante em `el_var` e `el_toggle` |

**Nenhuma nova função foi adicionada ao `databaseUtilsMySQL.js`.** Todas as operações necessárias já estavam implementadas.

---

## Autoavaliação

### Conformidade com AI_RULES.md

| Regra | Status |
|---|---|
| Não criar arquitetura paralela | ✅ Apenas `elementais.js` modificado |
| Reutilizar funções existentes | ✅ 4 funções da ETAPA 1 reutilizadas sem modificação |
| Banco como fonte da verdade | ✅ `tb_elemental_collection` é a única fonte de estado de posse |
| Callbacks apenas com IDs | ✅ `el_toggle_42`, não `el_toggle_duck-basic` |
| Priorizar edição de mensagem | ✅ `editMessageCaption`/`editMessageText` — sem reenvio desnecessário |
| Não antecipar ETAPAs futuras | ✅ Stubs mantidos; `/colecao`, `/estatisticas`, etc. não implementados |
| Uma função por responsabilidade | ✅ Toggle, montagem de caption e navegação separados |
| Sem código morto | ✅ Nenhum callback registrado sem uso |
| Revisão crítica antes da entrega | ✅ Ver seção abaixo |

### Revisão crítica aplicada

**Duplicação de montagem de caption:** Os handlers `el_var` e `el_toggle` montam a mesma caption. Uma função auxiliar `buildVariantCaption(variant)` eliminaria a repetição. Decisão: **não extraído nesta etapa** — são exatamente 6 linhas, a extração criaria uma função de escopo de arquivo que pertence ao módulo mas não é reutilizada por nenhum outro handler atual. A ETAPA 5 (`/sprite <nome>`) também precisará montar a mesma caption; nesse momento a extração se justifica. **Registrado como pendência para ETAPA 5.**

**`getUserCollectionIds` vs `hasVariantInCollection`:** Dois chamadas diferentes para verificar posse — `getUserCollectionIds` (para lista) e `hasVariantInCollection` (para ficha individual). Correto: a lista precisa verificar N variantes de uma vez (Set é eficiente); a ficha verifica apenas 1 (query direta é mais legível e igualmente eficiente para 1 item).

**`Promise.all` em `el_var`:** Correto — as duas consultas (`getVariantById` + `hasVariantInCollection`) são independentes e paralelas. Reduz latência percebida.

---

## Pendências registradas

| Item | Prioridade | Etapa sugerida |
|---|---|---|
| Extrair `buildVariantCaption(variant)` para evitar duplicação em `el_var` e `el_toggle` | Baixa | ETAPA 5 (quando `/sprite <nome>` também precisar) |
| Indicador visual no menu de categorias (ex: `Basic ●●●○○`) | Média | ETAPA 5 ou 6 |

---

## Próximos passos (ETAPA 5)

Implementar `/sprite <nome>` — ficha de um sprite buscado por nome:
- Buscar sprite por texto (`getSpriteBySlug` ou `LIKE` em `name`)
- Se sprite tiver múltiplas variantes, listar variantes com botões
- Exibir ficha da variante selecionada (mesmo formato de `el_var`)
- Botão de toggle presente (reutiliza `el_toggle`)

**Aguardando aprovação para iniciar a ETAPA 5.**
