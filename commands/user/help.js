module.exports = (bot) => {
  bot.command('help', (ctx) => {
    ctx.reply(`
<b>🤖 FortMeBot - Lista de Comandos 🤖</b>

<b>📌 Comandos para Usuários:</b>
- <b>/help</b> - Exibe esta lista de comandos 📝
- <b>/tryhardme</b> - Descubra se você é Try Hard ou Embananado hoje 💪🍌
- <b>/fortgirl</b> - Veja as skins disponíveis e avalie 👩‍🎤
- <b>/jonesyme</b> - Descubra mais sobre o Jonesy no Fortnite 🧔
- <b>/x1</b> - Desafie alguém para um duelo interativo com botões ⚔️
- <b>/ranking</b> - Veja o ranking diário de vitórias em duelos X1 🏆
- <b>/x1stats</b> - Estatísticas detalhadas dos duelos X1 do dia 📊

<b>🔒 Comandos para Administradores:</b>
- <b>/manageGroups</b> - Gerencia os grupos registrados 🔧
- <b>/manageFortGirls</b> - Gerencia as skins registradas no banco de dados 👩‍🎤
- <b>/manageCrons</b> - Gerencia o estado dos crons configurados ⏳
- <b>/addAdmin</b> - Adiciona novos administradores 👤
- <b>/watchGroup</b> - Registra novos grupos para o bot 🏠
- <b>/registerFortJonesy</b> - Registra imagens para o comando FortJonesy 🧔
- <b>/registerTryhardImage</b> - Registra imagens para Try Hard e Embananado 🎞️
- <b>/registerFortMe</b> - Registra imagens para o comando FortMe 🎮
- <b>/registerFortGirl</b> - Registra skins para o comando FortGirl 👗
- <b>/listconfig</b> - Lista as configurações atuais 📋
- <b>/setcron</b> - Configura o horário das tarefas automáticas ⏰
- <b>/clearDatabase</b> - Apaga os dados do banco de dados (dia atual ou completo) 🗑️
- <b>/registerGroups</b> - Registra grupos a partir dos arquivos daly 🏠
- <b>/listGroups</b> - Exibe os grupos registrados 📋
- <b>/registerMessage</b> - Registra uma mensagem para divulgação ✉️
- <b>/sendBroadcast</b> - Envia mensagens para os grupos registrados 📢

<b>💡 Dica:</b> Use os comandos com sabedoria e divirta-se no Fortnite! 🚀
    `.trim(), { parse_mode: 'HTML' });
  });
};
