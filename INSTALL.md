# 📖 Guia de Instalação do FortMeBot - Para Iniciantes

Bem-vindo! Este guia vai te ensinar passo a passo como instalar e configurar o FortMeBot, mesmo se você nunca programou antes.

## 📋 O que você vai precisar

Antes de começar, você precisa ter:
- Um computador com Windows, Mac ou Linux
- Conexão com a internet
- Aproximadamente 30 minutos de tempo
- Uma conta no Telegram

## 🎯 Passo 1: Instalar o Node.js

Node.js é a plataforma que permite executar o bot.

### Windows

1. Acesse [nodejs.org](https://nodejs.org/)
2. Clique no botão verde **"LTS"** (versão recomendada)
3. Baixe o instalador
4. Execute o arquivo baixado
5. Clique em **"Next"** em todas as telas (deixe as opções padrão)
6. Clique em **"Install"** e aguarde
7. Clique em **"Finish"**

### Mac

1. Acesse [nodejs.org](https://nodejs.org/)
2. Clique no botão verde **"LTS"**
3. Baixe o instalador `.pkg`
4. Abra o arquivo e siga as instruções
5. Digite sua senha quando solicitado

### Linux (Ubuntu/Debian)

Abra o terminal e execute:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verificar Instalação

Abra o terminal (ou prompt de comando no Windows) e digite:

```bash
node --version
```

Deve aparecer algo como: `v18.x.x` ou `v20.x.x`

```bash
npm --version
```

Deve aparecer algo como: `9.x.x` ou `10.x.x`

✅ **Se aparecer as versões, está tudo certo!**

## 🎯 Passo 2: Criar um Bot no Telegram

Agora você precisa criar seu bot e obter o token de acesso.

### 2.1 Falar com o BotFather

1. Abra o Telegram no celular ou computador
2. Na busca, procure por: **@BotFather**
3. Clique em **"Start"** ou envie `/start`

### 2.2 Criar o Bot

1. Envie o comando: `/newbot`
2. O BotFather vai pedir um **nome** para seu bot
   - Exemplo: `Meu Fort Bot`
   - Digite e envie
3. Depois ele pede um **username** (deve terminar com `bot`)
   - Exemplo: `MeuFortBot` ou `MeuFort_bot`
   - Digite e envie
4. **IMPORTANTE**: O BotFather vai te enviar um **token** (uma sequência longa de números e letras)
   - Exemplo: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - **COPIE ESSE TOKEN** e guarde em um lugar seguro
   - ⚠️ **NUNCA compartilhe esse token com ninguém!**

✅ **Seu bot está criado!**

## 🎯 Passo 3: Baixar o Código do FortMeBot

### Opção 1: Baixar ZIP (Mais Fácil)

1. Acesse: [github.com/c3bola/FortMeBot](https://github.com/c3bola/FortMeBot)
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Descompacte o arquivo em uma pasta de sua escolha
   - Exemplo: `C:\Meus Projetos\FortMeBot` (Windows)
   - Exemplo: `/Users/seunome/Projetos/FortMeBot` (Mac)
   - Exemplo: `/home/seunome/projetos/FortMeBot` (Linux)

### Opção 2: Usar Git (Para quem já conhece)

```bash
git clone https://github.com/c3bola/FortMeBot.git
cd FortMeBot
```

## 🎯 Passo 4: Instalar as Dependências

### 4.1 Abrir o Terminal na Pasta do Projeto

**Windows:**
1. Abra a pasta onde você descompactou o projeto
2. Clique no caminho da pasta (barra de endereço)
3. Digite `cmd` e aperte Enter
4. O terminal vai abrir na pasta correta

**Mac:**
1. Abra o Finder e vá até a pasta do projeto
2. Clique com botão direito na pasta
3. Segure a tecla **Option** e clique em **"Copiar [nome] como Nome de Caminho"**
4. Abra o Terminal
5. Digite `cd` (com espaço) e cole o caminho
6. Aperte Enter

**Linux:**
1. Abra o gerenciador de arquivos
2. Navegue até a pasta do projeto
3. Clique com botão direito e escolha **"Abrir no Terminal"**

### 4.2 Instalar Pacotes

No terminal que você abriu, digite:

```bash
npm install
```

Aguarde... Vai aparecer várias mensagens. É normal! 

✅ **Quando terminar, as dependências estão instaladas!**

## 🎯 Passo 5: Configurar o Bot

### 5.1 Criar o Arquivo .env

1. Na pasta do projeto, você vai ver um arquivo chamado `.env.example`
2. Copie esse arquivo (Ctrl+C, Ctrl+V)
3. Renomeie a cópia para `.env` (apenas `.env`, sem "example")

**Atenção Windows:** Se você não consegue ver a extensão dos arquivos:
1. Abra o Explorador de Arquivos
2. Clique em **"Exibir"** (na barra superior)
3. Marque a opção **"Extensões de nomes de arquivos"**

### 5.2 Adicionar seu Token

1. Abra o arquivo `.env` com um editor de texto (Bloco de Notas serve)
2. Você vai ver:
   ```
   TELEGRAM_API_KEY=your_telegram_api_key_here
   ```
3. Substitua `your_telegram_api_key_here` pelo token que você copiou do BotFather
4. Deve ficar assim:
   ```
   TELEGRAM_API_KEY=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. Salve o arquivo (Ctrl+S)

### 5.3 Configurar como Administrador

1. Abra o arquivo `config/config.json`
2. Procure a seção `"admins"`:
   ```json
   "admins": [
     {
       "name": "C3bola",
       "id": 121823278
     }
   ]
   ```
3. Você precisa descobrir seu ID do Telegram
   - Abra o Telegram
   - Procure por: **@userinfobot**
   - Clique em Start
   - O bot vai te mostrar seu ID
4. Substitua o ID no arquivo pelo seu:
   ```json
   "admins": [
     {
       "name": "SeuNome",
       "id": SEU_ID_AQUI
     }
   ]
   ```
5. Salve o arquivo

## 🎯 Passo 6: Iniciar o Bot

Agora é a hora da verdade!

No terminal (na pasta do projeto), digite:

```bash
node fortMe.js
```

Você deve ver mensagens como:
```
[DEBUG] Comandos de usuário registrados com sucesso.
[DEBUG] Comandos de administradores registrados com sucesso.
Bot iniciado com sucesso!
```

✅ **SEU BOT ESTÁ FUNCIONANDO!**

## 🎯 Passo 7: Testar o Bot

1. Abra o Telegram
2. Procure pelo username do seu bot (o que você criou no Passo 2)
3. Clique em **"Start"** ou envie `/start`
4. Envie o comando `/help`
5. O bot deve responder!

### Adicionar o Bot em um Grupo

1. Crie um grupo no Telegram
2. Adicione seu bot ao grupo
3. No grupo, envie `/help`
4. O bot deve responder!

## 🔧 Solução de Problemas

### Problema: "npm não é reconhecido como comando"

**Solução:** Node.js não foi instalado corretamente. Volte ao Passo 1.

### Problema: "Cannot find module"

**Solução:** Execute novamente `npm install` na pasta do projeto.

### Problema: Bot não responde no Telegram

**Verificações:**
1. O bot está rodando no terminal? (Você deve ver "Bot iniciado com sucesso!")
2. O token no `.env` está correto?
3. Você copiou o token completo, sem espaços?

### Problema: "Error: 401 Unauthorized"

**Solução:** O token está errado. Verifique o arquivo `.env` e copie novamente o token do BotFather.

### Problema: Bot para quando fecho o terminal

**Solução:** Isso é normal! Existem duas opções:

#### Opção 1: Deixar o Terminal Aberto
Deixe o terminal aberto enquanto quiser que o bot funcione.

#### Opção 2: Usar PM2 (Avançado)

PM2 mantém o bot rodando em segundo plano:

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o bot com PM2
pm2 start fortMe.js --name "FortMeBot"

# Ver status
pm2 status

# Ver logs
pm2 logs FortMeBot

# Parar o bot
pm2 stop FortMeBot

# Reiniciar o bot
pm2 restart FortMeBot
```

## 📱 Próximos Passos

Agora que seu bot está funcionando:

1. **Personalize as Mensagens**: Edite `config/phrases.json`
2. **Configure os Grupos**: Use `/addgroup` no seu bot
3. **Adicione Mais Admins**: Use `/addadmin` no seu bot
4. **Configure Cron Jobs**: Use `/managecrons` para agendar tarefas
5. **Explore os Comandos**: Teste todos os comandos disponíveis

## 📚 Aprendendo Mais

### Recursos Úteis

- **Node.js**: [nodejs.dev/learn](https://nodejs.dev/learn)
- **Telegraf**: [telegraf.js.org](https://telegraf.js.org/)
- **JavaScript**: [javascript.info](https://javascript.info/)

### Documentação do Projeto

- [README.md](README.md) - Documentação completa do projeto
- [Telegram Bot API](https://core.telegram.org/bots/api) - API oficial do Telegram

## 🆘 Precisa de Ajuda?

Se você seguiu todos os passos e ainda tem problemas:

1. **Leia novamente o passo que deu erro**: Às vezes esquecemos algo pequeno
2. **Verifique os logs**: O terminal mostra mensagens de erro úteis
3. **Abra uma Issue**: [github.com/c3bola/FortMeBot/issues](https://github.com/c3bola/FortMeBot/issues)
4. **Entre em Contato**: fnc3bola@gmail.com

## 🎉 Parabéns!

Você instalou seu primeiro bot do Telegram! 🚀

Isso foi um grande passo no mundo da programação. Continue estudando e explorando!

---

### 📝 Checklist Final

Antes de considerar a instalação completa, verifique:

- [ ] Node.js instalado e funcionando
- [ ] Bot criado no BotFather
- [ ] Token copiado e salvo
- [ ] Código baixado
- [ ] `npm install` executado
- [ ] Arquivo `.env` criado e configurado
- [ ] Seu ID adicionado como admin em `config.json`
- [ ] Bot iniciado com `node fortMe.js`
- [ ] Bot respondendo no Telegram
- [ ] Comandos funcionando

✅ **Pronto para usar o FortMeBot!**

---

💡 **Dica Final**: Salve este guia! Você pode precisar dele no futuro para reinstalar ou ajudar outros.

⭐ **Gostou?** Dê uma estrela no GitHub!

🔙 [Voltar para o README principal](README.md)
