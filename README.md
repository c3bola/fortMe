# 🎮 FortMeBot - Bot da Comunidade Fortnite Brasil

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Telegraf](https://img.shields.io/badge/Telegraf-4.12.2-blue.svg)](https://telegraf.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Fala galera! Este é o FortMeBot, um bot criado pra galera da comunidade **Fortnite Brasil no Telegram**. Ele nasceu da necessidade de criar mais engajamento e interatividade nos grupos, transformando conversas normais em competições diárias, rankings e muita zoeira saudável.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Técnicas Implementadas](#técnicas-implementadas)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Justificativa dos Arquivos JSON](#justificativa-dos-arquivos-json)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Comandos Disponíveis](#comandos-disponíveis)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

Sabe quando o grupo fica meio parado e ninguém sabe o que falar? Pois é, o FortMeBot resolve isso!

Criado pelo **C3bola** (sim, aquele mesmo!), o bot surgiu da comunidade **Fortnite Brasil no Telegram** com um objetivo simples: **criar engajamento e promover interatividade**. Ao invés de só conversar sobre o jogo, agora você pode participar de desafios diários, competir em rankings, desafiar a galera pro X1 e muito mais.

O legal é que o bot torna o grupo mais vivo. Todo dia tem Fort Girl pra votar, tryhard pra julgar, e aquele amigo que sempre manda selfie no Fort Me pra todo mundo zoar (ou elogiar, né). É tipo uma rede social dentro do Telegram, mas só da galera que joga Fortnite.

### Por que esse bot existe?

Grupos de Fortnite no Telegram costumam ter dois problemas:
1. **Falta de engajamento** - O pessoal entra, mas não interage muito
2. **Monotonia** - Sempre as mesmas conversas sobre o jogo

O FortMeBot resolve isso gamificando a experiência. Agora você não só fala sobre Fortnite, você **compete**, **vota**, **desafia** e **sobe no ranking**. O grupo vira quase um mini-jogo à parte.

### O que tem de especial?

- **Modularidade**: Código bem organizado, fácil de adicionar novos comandos
- **Escalabilidade**: Funciona em vários grupos ao mesmo tempo sem travar
- **Automatização**: Todo dia às 23h o bot anuncia os vencedores sozinho
- **Persistência**: Tudo fica salvo, os rankings são históricos
- **Segurança**: Sua API key fica protegida e não vai parar no GitHub

## 🛠️ Técnicas Implementadas

### 1. **Arquitetura Modular**
O bot utiliza uma arquitetura modular baseada em separação de responsabilidades:
- Cada comando é um módulo independente
- Separação clara entre comandos de usuários e administradores
- Utilitários reutilizáveis centralizados

### 2. **Middleware Pattern**
Implementação de middlewares no Telegraf para:
- Normalização de comandos (remoção de `@botname`)
- Resposta automática de callback queries
- Logging e debugging estruturado

### 3. **Cron Jobs**
Sistema de agendamento automatizado para:
- Análises diárias de rankings
- Promoção de eventos X1
- Anúncios de vencedores
- Resets de pontuações

### 4. **Sistema de Permissões**
Controle de acesso baseado em roles:
- Comandos restritos a administradores
- Verificação de permissões em tempo real
- Gestão dinâmica de administradores

### 5. **Persistência de Dados**
Uso estratégico de JSON para armazenamento:
- Leitura/escrita assíncrona
- Backup automático de dados
- Estrutura de dados flexível

### 6. **Environment Variables**
Segurança através de variáveis de ambiente:
- API keys protegidas
- Configurações sensíveis isoladas
- `.gitignore` para proteção no versionamento

## 📁 Estrutura de Diretórios

A organização do projeto foi cuidadosamente planejada para facilitar o desenvolvimento e manutenção:

```
FortMeBot/
├── commands/                    # Módulos de comandos do bot
│   ├── userCommands.js         # Orquestrador de comandos de usuários
│   ├── adminCommands.js        # Orquestrador de comandos admin
│   ├── user/                   # Comandos disponíveis para todos
│   │   ├── fortgirl.js        # Comando de votação Fort Girl
│   │   ├── fortme.js          # Comando de auto-avaliação
│   │   ├── help.js            # Sistema de ajuda
│   │   ├── jonesyme.js        # Comando Jonesy
│   │   ├── ranking.js         # Visualização de rankings
│   │   ├── tryhardme.js       # Comando Tryhard
│   │   ├── x1.js              # Sistema de desafios 1v1
│   │   └── x1stats.js         # Estatísticas de X1
│   └── admin/                  # Comandos restritos a admins
│       ├── addAdmin.js        # Adicionar administradores
│       ├── addGroup.js        # Cadastrar novos grupos
│       ├── botConfig.js       # Configurações do bot
│       ├── broadcast.js       # Envio de mensagens em massa
│       ├── clearDatabase.js   # Limpeza de banco de dados
│       ├── manageCrons.js     # Gerenciamento de cron jobs
│       ├── manageGroups.js    # Gestão de grupos
│       └── register*.js       # Cadastros de imagens/recursos
│
├── config/                      # Configurações do bot
│   ├── config.js              # Carregador de configurações
│   ├── config.json            # Configurações gerais
│   └── phrases.json           # Frases e mensagens
│
├── cron/                       # Sistema de agendamento
│   ├── cronJobs.js            # Inicializador de cron jobs
│   └── functions/             # Funções agendadas
│       ├── analyzeDalyGirl.js # Análise diária Fort Girl
│       ├── analyzeFortMe.js   # Análise Fort Me
│       ├── analyzeJonesy.js   # Análise Jonesy
│       ├── tryhardRanking.js  # Ranking Tryhard
│       └── x1Promotion.js     # Promoção de eventos X1
│
├── database/                   # Persistência de dados
│   ├── broadcast.json         # Registro de broadcasts
│   ├── dailyx1.json           # Dados diários de X1
│   ├── dalygirl.json          # Votações Fort Girl
│   ├── dalyjonesy.json        # Dados Jonesy
│   ├── dalyme.json            # Auto-avaliações
│   ├── dalytryhard.json       # Dados Tryhard
│   ├── fortgirl.json          # Imagens Fort Girl
│   ├── fortjonesy.json        # Imagens Jonesy
│   └── fortme.json            # Configurações Fort Me
│
├── utils/                      # Utilitários compartilhados
│   ├── databaseUtils.js       # Funções de banco de dados
│   └── logger.js              # Sistema de logging
│
├── fortMe.js                   # Arquivo principal do bot
├── package.json               # Dependências e scripts
├── .env                       # Variáveis de ambiente (não versionado)
├── .env.example               # Template de variáveis
└── .gitignore                 # Arquivos ignorados pelo Git
```

### 🎯 Benefícios da Estrutura

#### **1. Separação de Responsabilidades**
- **`commands/`**: Cada comando em seu próprio arquivo facilita localização e edição
- **`user/` vs `admin/`**: Separação clara de permissões reduz erros de segurança
- **`cron/functions/`**: Funções agendadas isoladas para fácil manutenção

#### **2. Escalabilidade**
- Adicionar novo comando: criar arquivo em `commands/user/` ou `commands/admin/`
- Adicionar nova tarefa agendada: criar função em `cron/functions/`
- Modular: cada parte pode crescer independentemente

#### **3. Manutenibilidade**
- Bugs são fáceis de localizar (estrutura lógica)
- Testes podem ser feitos por módulo
- Código organizado facilita onboarding de novos desenvolvedores

#### **4. Reutilização**
- `utils/`: funções compartilhadas evitam duplicação de código
- `config/`: configurações centralizadas
- `database/`: estrutura de dados padronizada

#### **5. Colaboração**
- Múltiplos desenvolvedores podem trabalhar em comandos diferentes sem conflitos
- Pull requests mais organizados
- Code review mais eficiente

## 📄 Justificativa dos Arquivos JSON

### Por que JSON ao invés de um banco de dados tradicional?

#### **1. Simplicidade**
```javascript
// Leitura simples e direta
const data = JSON.parse(fs.readFileSync('database/ranking.json'));
```
- Sem necessidade de setup complexo de banco de dados
- Sem ORM ou queries SQL
- Formato legível para humanos

#### **2. Performance para Escala Pequena/Média**
- Bot para comunidades (não milhões de usuários)
- Leitura/escrita rápida para datasets pequenos
- Zero latência de rede (arquivo local)

#### **3. Portabilidade**
- Fácil fazer backup: copiar arquivos
- Migração simples entre servidores
- Versionamento possível com Git (exceto dados sensíveis)

#### **4. Desenvolvimento Ágil**
- Modificar estrutura de dados sem migrations
- Debugging visual (abrir JSON e ver os dados)
- Prototipagem rápida

#### **5. Zero Custo**
- Sem servidor de banco de dados
- Sem custos de hospedagem adicional
- Sem dependências externas

#### **6. Estrutura Flexível**
```json
{
  "users": {
    "123456": {
      "name": "Player1",
      "score": 100,
      "customField": "qualquer coisa"
    }
  }
}
```
- Schema flexível (NoSQL-like)
- Fácil adicionar novos campos
- Ideal para dados não relacionais

### Quando Migrar para Banco de Dados?

Considere migrar para PostgreSQL/MongoDB quando:
- ✅ Mais de 10.000 usuários ativos
- ✅ Necessidade de queries complexas
- ✅ Concorrência alta (muitas escritas simultâneas)
- ✅ Necessidade de transações ACID
- ✅ Dados relacionais complexos

## ⚡ Funcionalidades

### 👥 Comandos para Usuários (A Parte Divertida!)

**Fort Girl** 🌸
Todo dia o bot manda a foto de uma Fort Girl aleatória e o pessoal vota. Quem receber mais votos vira a Fort Girl do dia e ganha pontos no ranking. É tipo um concurso de beleza, mas do Fortnite. A zoeira é garantida nos comentários!

**Fort Me** 🤳
Quer saber se você é bonito(a)? Manda sua selfie com o comando /fortme e deixa a comunidade julgar. Você recebe notas de 0 a 10 e todo mundo pode comentar. No final do dia, quem tirar a maior média ganha. Preparado pro ego boost (ou destruição)?

**Jonesy Me** 👨
Versão masculina do Fort Girl. Manda aquela foto estilo Jonesy e espera os votos. Quem tiver mais confiança (ou menos vergonha) geralmente ganha!

**Tryhard Me** 💀
Posta print das suas kills, builds insanos ou aquela vitória épica. A galera vota em quem foi o mais tryhard do dia. Quanto mais suor, melhor!

**X1** ⚔️
Chama alguém pro X1! O bot gerencia o desafio e depois você reporta o resultado. Tem até ranking de X1 pra ver quem é o terror do grupo.

**X1 Stats** 📊
Quer saber quantos X1 você ganhou (ou perdeu)? Esse comando mostra suas estatísticas completas. Prepare-se pra humildade ou orgulho extremo.

**Rankings** 🏆
Veja quem está dominando o grupo. Tem ranking de Fort Girl, Fort Me, Tryhard, X1... Se existe competição, existe ranking!

**Help** ❓
Tá perdido? O comando /help explica tudo direitinho. Tem até menu interativo pra você não se perder.

### 👑 Comandos para Administradores (O Lado Sério)

**Gerenciamento de Grupos**
Adiciona ou remove grupos onde o bot vai funcionar. Útil quando você administra vários grupos.

**Gerenciamento de Admins**
Dá permissão pra galera de confiança ajudar a moderar o bot. Nem todo mundo precisa ser super admin.

**Broadcasts**
Precisa avisar algo importante? Manda uma mensagem que vai pra todos os grupos de uma vez. Tipo um megafone.

**Cron Jobs**
Configura os horários que o bot vai fazer as coisas automaticamente. Tipo anunciar vencedores todo dia às 23h.

**Registros**
Adiciona novas imagens de Fort Girls, Jonesy, ou Tryhard que o bot vai usar nos comandos.

**Configurações**
Ajusta como o bot se comporta. Tipo um painel de controle.

**Database**
Limpa os dados quando necessário. Use com cuidado, apaga tudo!

## 📦 Instalação

**Para um guia detalhado passo a passo, consulte o [INSTALL.md](INSTALL.md)**

Instalação rápida para desenvolvedores:

```bash
# Clone o repositório
git clone https://github.com/c3bola/FortMeBot.git
cd FortMeBot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua TELEGRAM_API_KEY

# Inicie o bot
node fortMe.js
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Edite o arquivo `.env`:

```env
TELEGRAM_API_KEY=seu_token_do_botfather
```

### 2. Configurações do Bot

Edite `config/config.json` para ajustar:
- Administradores
- Grupos ativos
- Configurações de cron jobs
- IDs de logs

### 3. Frases Personalizadas

Edite `config/phrases.json` para personalizar mensagens do bot.

## 🚀 Uso

### Iniciar o Bot

```bash
node fortMe.js
```

### Comandos no Telegram

#### Usuários
```
/fortgirl - Vote na Fort Girl do dia
/fortme - Envie sua selfie
/help - Ajuda e comandos
/ranking - Ver rankings
/x1 - Desafiar para 1v1
```

#### Administradores
```
/addadmin - Adicionar administrador
/addgroup - Cadastrar grupo
/broadcast - Enviar mensagem em massa
/botconfig - Configurações
/managecrons - Gerenciar agendamentos
```

## 📊 Comandos Disponíveis

### Comandos de Usuário (Pra Zoar e Competir)

| Comando | O que faz? | Como usar |
|---------|-----------|---------|
| `/fortgirl` | Vota na Fort Girl do dia. Todo dia uma skin aleatória, quem tiver mais votos ganha! | Só mandar `/fortgirl` no grupo |
| `/fortme` | Manda sua selfie e recebe notas de 0-10 da galera. Média no final do dia vira pontos | `/fortme` (manda a foto junto) |
| `/jonesyme` | Versão Jonesy do Fort Me. Pra quem tem coragem de mostrar a cara | `/jonesyme` (com foto) |
| `/tryhardme` | Posta seus prints de partidas insanas. Maior votação = mais tryhard do dia | `/tryhardme` (com print ou foto) |
| `/x1 @user` | Desafia alguém pro mano a mano. Bot gerencia tudo, vocês só jogam e reportam | `/x1 @fulano` |
| `/x1stats` | Quer saber quantos X1 você já ganhou? Esse comando te conta tudo | `/x1stats` |
| `/ranking` | Mostra quem manda no pedaço. Tem ranking de tudo! | `/ranking` |
| `/help` | Tá perdido? Esse comando te salva com menu interativo e tudo | `/help` |

### Comandos de Admin (Pra Quem Manda)

| Comando | O que faz? | Quem pode usar |
|---------|-----------|----------------|
| `/addadmin` | Adiciona um novo admin. Cuidado com quem você confia! | Super Admin |
| `/listadmins` | Lista todos os admins do bot | Qualquer Admin |
| `/addgroup` | Cadastra um novo grupo pra usar o bot | Admin |
| `/managegroups` | Gerencia quais grupos estão ativos | Admin |
| `/broadcast` | Manda mensagem pra todos os grupos de uma vez. Tipo um megafone | Admin |
| `/botconfig` | Mexe nas configurações do bot | Admin |
| `/managecrons` | Configura os horários das tarefas automáticas | Admin |
| `/cleardatabase` | CUIDADO! Apaga tudo. Só use se souber o que tá fazendo | Super Admin |

## 🤝 Contribuindo

Quer ajudar a melhorar o bot? Boa! A comunidade agradece. Aqui vai o passo a passo:

1. Faz um fork do projeto (aquele botãozinho lá em cima)
2. Cria uma branch nova pra sua ideia (`git checkout -b feature/MinhaIdeiaMassa`)
3. Faz as alterações e commita (`git commit -m 'Adicionei comando novo: /fortpet'`)
4. Manda pro seu fork (`git push origin feature/MinhaIdeiaMassa`)
5. Abre um Pull Request aqui

### Algumas Regras (Nada Chato, Prometo)

- **Segue a estrutura**: Se é comando de usuário, vai na pasta `commands/user/`. Sem bagunça!
- **Comenta o código**: Se você fez algo complexo, explica. Seu eu do futuro agradece.
- **Testa antes**: Roda o bot e testa se não quebrou nada. Ninguém gosta de bug.
- **Atualiza o README**: Adicionou comando novo? Coloca aqui na documentação.

A ideia é manter o código limpo e fácil de entender. Quanto mais gente contribuir, mais legal o bot fica!

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**C3bola** - O maluco que teve a ideia e botou pra funcionar

- GitHub: [@c3bola](https://github.com/c3bola)
- Email: fnc3bola@gmail.com
- Telegram: @c3bola (provavelmente no top 3 do ranking Fort Me)

## 🙏 Agradecimentos

- **Comunidade Fortnite Brasil no Telegram** - Vocês que motivaram esse projeto! A zoeira nunca para.
- [Telegraf](https://telegraf.js.org/) - Framework que faz o bot conversar com o Telegram
- [Node-Cron](https://github.com/node-cron/node-cron) - Responsável por fazer as coisas acontecerem no horário certo
- Toda a galera que testa os comandos e reporta bugs (mesmo sem querer)

---

⭐ **Curtiu o bot?** Dá uma estrela aqui no GitHub! Ajuda a motivar e mostrar pra galera que o projeto é bom.

🐛 **Achou um bug?** Acontece! [Abre uma issue](https://github.com/c3bola/FortMeBot/issues) e vamos resolver junto.

💬 **Dúvidas?** Chama no email ou abre uma issue. A comunidade ajuda também!

🎮 **Usa o bot no seu grupo?** Conta pra gente! Adoramos saber que tá funcionando e gerando engajamento.
