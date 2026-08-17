# ETAPA 3 — Catálogo de Sprites Elementais

**Status:** ✅ Concluída  
**Data:** 2026-06-24

---

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `commands/user/elementais.js` | Implementação completa do catálogo (substituiu os stubs da ETAPA 2) |
| `commands/userCommands.js` | Registro do `/sprites` adicionado ao branch `else` da feature flag |

---

## O que foi implementado

### Comandos

| Comando | Função |
|---|---|
| `/elementais` | Exibe o menu de categorias |
| `/sprites` | Alias de `/elementais` — idêntico em comportamento |

Ambos chamam `ensureUser` (registro do usuário) e `ensureBotGroup` (registro do grupo) antes de exibir o menu, seguindo o padrão estabelecido em `fortme.js`.

---

### Fluxo de navegação

```
/elementais  ou  /sprites
       │
       ▼
[TEXT] Menu de categorias
  ⚪ Basic  🟡 Gold  🍬 Candy ...
       │  el_cat_{id}
       ▼
[TEXT] Lista de Sprites da categoria
  Duck  Earth  Fire  Ghost ...  ⬅️ Categorias
       │  el_var_{id}              │ el_back_cat
       ▼                           └──────────┐
[FOTO] Ficha da variante                      │
  Nome, Categoria, Raridade,                  │
  Local, Custo, Chance, Lore                  │
  ⬅️ {Categoria}                              │
       │  el_cat_{id}                         │
       └──────────────────────────────────────┘
```

---

### Decisões técnicas

**Única fonte de verdade: banco de dados**

O diretório `src/assets/images/Elementais/` não é lido para construir nenhum menu. Todas as listas (categorias, sprites, variantes) são obtidas exclusivamente via:
- `getElementalCategories()` — menu de categorias
- `getVariantsByCategory(id)` — lista de sprites por categoria
- `getVariantById(id)` — ficha completa da variante

**Imagens: recurso visual via caminho do banco**

O campo `tb_elemental_variant.image` armazena o caminho relativo (ex: `Elementais/Base_Duck.png`). O handler `el_var_{id}` constrói o caminho absoluto com `path.join(IMAGES_BASE, variant.image)` e verifica a existência com `fs.existsSync`. Se o arquivo existir, envia como foto (`ctx.replyWithPhoto({ source: fs.createReadStream(path) })`). Caso contrário, exibe a ficha em modo texto.

**Transição texto → foto → texto**

O Telegram não permite editar uma mensagem de texto para mídia nem vice-versa. A solução adotada:

- Navegação entre categorias e sprites: `ctx.editMessageText()` (edição da mesma mensagem)
- Abertura da ficha (`el_var_{id}`): `ctx.deleteMessage()` + `ctx.replyWithPhoto()` (nova mensagem de foto)
- Retorno da ficha à categoria (`el_cat_{id}`): detecta `ctx.callbackQuery.message.photo` → `ctx.deleteMessage()` + `ctx.reply()` (nova mensagem de texto)
- Retorno ao menu de categorias (`el_back_cat`): sempre vem de texto → `ctx.editMessageText()`

Todos os `deleteMessage()` estão dentro de `try/catch` para não quebrar o fluxo caso falhem (ex: falta de permissão em grupos).

**Callbacks não implementados nesta etapa**

`el_spr_{id}` e `el_back_spr_{id}` permanecem como stubs (só `answerCbQuery()`). Serão implementados em etapa futura para o perfil do sprite com todas as suas variantes.

---

## Callbacks ativos por etapa

| Callback | Etapa | Estado |
|---|---|---|
| `el_cat_{id}` | 3 | ✅ Implementado |
| `el_back_cat` | 3 | ✅ Implementado |
| `el_var_{id}` | 3 | ✅ Implementado |
| `el_spr_{id}` | futura | stub |
| `el_back_spr_{id}` | futura | stub |

---

## Próximos passos (ETAPA 4)

Implementar a marcação da coleção:
- Botão "✅ Tenho" / "❌ Não tenho" na ficha da variante
- Toggle de posse via `el_toggle_{variantId}`
- Indicador visual de posse nos menus de sprites

**Aguardando aprovação para iniciar a ETAPA 4.**
