# ETAPA 2 — Integração do Módulo ao FortMe

**Status:** ✅ Concluída (revisada em 2026-06-24)

---

## Arquivos criados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `commands/user/elementais.js` | Novo | Comando `/elementais` + 5 callbacks de catálogo com prefixo `el_` |

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `commands/userCommands.js` | Bloco `elementais` adicionado com guard de feature flag |
| `commands/adminCommands.js` | Sem alteração final — entrada de `manageElementais` removida na revisão |
| `config/config.json` | `"elementais": true` adicionado ao objeto `commands` |

---

## Como o módulo foi integrado

### Feature flag
`config/config.json` → `commands.elementais: true`

Quando `false`, o bot registra um handler que responde com uma mensagem de desativação (padrão do projeto). Quando `true`, o arquivo `commands/user/elementais.js` é carregado.

### Registro de usuário (`userCommands.js`)
Segue exatamente o mesmo padrão `if/else` de todos os outros comandos:
```js
if (config.commands.elementais) {
  require('./user/elementais')(bot);
} else {
  bot.command('elementais', sendDisabledResponse);
}
```

---

## Callbacks registrados em `commands/user/elementais.js`

Apenas os callbacks necessários para a ETAPA 3 (catálogo):

| Regex | Etapa | Finalidade |
|---|---|---|
| `/^el_cat_(\d+)$/` | 3 | Navegar para uma categoria |
| `/^el_spr_(\d+)$/` | 3 | Abrir as variantes de um sprite |
| `/^el_var_(\d+)$/` | 3 | Detalhe de uma variante |
| `/^el_back_cat$/` | 3 | Voltar para lista de categorias |
| `/^el_back_spr_(\d+)$/` | 3 | Voltar para variantes do sprite |

Callbacks das ETAPAs 4–6 serão adicionados nas etapas correspondentes.

---

## Decisões da revisão crítica

**9 callbacks removidos** (ETAPAs 4–6): `el_toggle_*`, `el_col`, `el_col_cat_*`, `el_cfg`, `el_cfg_help_*`, `el_cfg_dm_*`, `el_cfg_mention_*`, `el_help_req_*`, `el_help_offer_*`. Em Telegraf, handlers são carregados no restart — não há benefício técnico em pré-registrá-los.

**`commands/admin/manageElementais.js` removido**: Nenhuma das ETAPAs definidas (3–7) menciona gerenciamento administrativo de Elementais. O arquivo será criado quando houver necessidade concreta.

---

## Validações

- ✅ Prefixo `el_` exclusivo — sem colisão com prefixos existentes (`fortme_`, `fortgirl_`, `x1_`, `navigate_`, `cmdt_`)
- ✅ Nenhuma lógica de negócio antecipada — todos os handlers são stubs de roteamento puros
- ✅ `adminCommands.js` retornado ao estado original (sem entrada de `manageElementais`)

---

## Próximos passos (ETAPA 3)

Implementar o catálogo de sprites:
- Exibir lista de categorias com contagem de sprites
- Navegar entre sprites de uma categoria
- Exibir detalhe de uma variante (imagem + raridade + status de posse)
- Paginação via callbacks `el_cat_*`, `el_spr_*`, `el_var_*`, `el_back_*`

**Aguardando aprovação para iniciar a ETAPA 3.**

**Status:** ✅ Concluída  
**Data:** 2026-06-24

---

## Arquivos criados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `commands/user/elementais.js` | Novo | Comando `/elementais` + 11 callbacks com prefixo `el_` |
| `commands/admin/manageElementais.js` | Novo | Comando `/manageElementais` + callback admin `el_adm_*` |

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `commands/userCommands.js` | Bloco `elementais` adicionado com guard de feature flag |
| `commands/adminCommands.js` | `loadCommand('./admin/manageElementais')` adicionado |
| `config/config.json` | `"elementais": true` adicionado ao objeto `commands` |

---

## Como o módulo foi integrado

### Feature flag
`config/config.json` → `commands.elementais: true`

Quando `false`, o bot registra um handler que responde com uma mensagem de desativação (padrão do projeto). Quando `true`, o arquivo `commands/user/elementais.js` é carregado.

### Registro de usuário (`userCommands.js`)
Segue exatamente o mesmo padrão `if/else` de todos os outros comandos:
```js
if (config.commands.elementais) {
  require('./user/elementais')(bot);
} else {
  bot.command('elementais', sendDisabledResponse);
}
```

### Registro de admin (`adminCommands.js`)
Segue o padrão `loadCommand` dos demais comandos admin (sem guard de flag):
```js
loadCommand('./admin/manageElementais');
```
A verificação de permissão está dentro do próprio arquivo (`config.admins.some(...)`), seguindo o padrão existente no projeto.

---

## Callbacks registrados em `commands/user/elementais.js`

| Regex | Etapa | Finalidade |
|---|---|---|
| `/^el_cat_(\d+)$/` | 3 | Navegar para uma categoria |
| `/^el_spr_(\d+)$/` | 3 | Abrir as variantes de um sprite |
| `/^el_var_(\d+)$/` | 3 | Detalhe de uma variante |
| `/^el_back_cat$/` | 3 | Voltar para lista de categorias |
| `/^el_back_spr_(\d+)$/` | 3 | Voltar para variantes do sprite |
| `/^el_toggle_(\d+)$/` | 4 | Marcar/desmarcar variante na coleção |
| `/^el_col$/` | 4 | Ver minha coleção completa |
| `/^el_col_cat_(\d+)$/` | 4 | Ver coleção filtrada por categoria |
| `/^el_cfg$/` | 5 | Abrir configurações do módulo |
| `/^el_cfg_help_([01])$/` | 5 | Alternar: aceitar pedidos de ajuda |
| `/^el_cfg_dm_([01])$/` | 5 | Alternar: aceitar mensagens privadas |
| `/^el_cfg_mention_([01])$/` | 5 | Alternar: permitir marcação no grupo |
| `/^el_help_req_(\d+)$/` | 6 | Solicitar ajuda para uma variante |
| `/^el_help_offer_(\d+)_(\d+)$/` | 6 | Oferecer ajuda a um pedido |

## Callback registrado em `commands/admin/manageElementais.js`

| Regex | Finalidade |
|---|---|
| `/^el_adm_(\w+)$/` | Ações de gerenciamento admin (futuro) |

---

## Validações realizadas

- ✅ `commands/userCommands.js` — bloco `elementais` posicionado após `x1`, antes do `console.log` de sucesso
- ✅ `commands/adminCommands.js` — `loadCommand` adicionado como último item
- ✅ `config/config.json` — `"elementais": true` inserido no objeto `commands`, JSON válido
- ✅ Prefixo `el_` exclusivo — sem colisão com prefixos existentes (`fortme_`, `fortgirl_`, `x1_`, `navigate_`, `cmdt_`)

---

## Próximos passos (ETAPA 3)

Implementar o catálogo de sprites:
- Exibir lista de categorias com contagem de sprites
- Navegar entre sprites de uma categoria
- Exibir detalhe de uma variante (imagem + raridade + posse)
- Paginação via callbacks `el_cat_*`, `el_spr_*`, `el_var_*`

**Aguardando aprovação para iniciar a ETAPA 3.**
