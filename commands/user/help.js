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
    - <b>/fortme</b> - Descubra sua sorte do dia no Fortnite 🎲

    <b>🔒 Comandos para Administradores:</b>
    - <b>/addAdmin</b> - Adiciona novos administradores 👤
    - <b>/botConfig</b> ou <b>/config</b> - Configura comandos do bot ⚙️
    - <b>/broadcast</b> - Gerencia mensagens de broadcast 📢
    - <b>/clearDatabase</b> - Apaga os dados do banco de dados (dia atual ou completo) 🗑️
    - <b>/list</b> - Lista informações:
        • <b>admin</b> — administradores
        • <b>group</b> — grupos registrados
        • <b>config</b> — configurações do bot
        • <b>jonesy</b> — imagens Jonesy
        • <b>fortGirls</b> — imagens FortGirls
        • <b>fortMe</b> — imagens FortMe
    - <b>/manageCrons</b> - Gerencia o estado dos crons configurados ⏳
    - <b>/manageFortGirls</b> - Gerencia as skins registradas 👩‍🎤
    - <b>/manageJonesy</b> - Gerencia as skins do Jonesy 🧔
    - <b>/registerFortGirl</b> - Registra skins para o comando FortGirl 👗
    - <b>/registerFortJonesy</b> - Registra imagens para o comando FortJonesy 🧔
    - <b>/registerFortMe</b> - Registra imagens para o comando FortMe 🎮
    - <b>/registerTryhardImage</b> - Registra imagens para Try Hard e Embananado 🎞️
    - <b>/rm</b> - Remove um item de jonesy, fortGirls ou fortMe ❌
    - <b>/setcron</b> - Configura o horário das tarefas automáticas ⏰
    - <b>/registerMessage</b> - Registra uma mensagem para divulgação ✉️
    - <b>/sendBroadcast</b> - Envia mensagens para os grupos registrados 📢

    <b>💡 Dica:</b> Use os comandos com sabedoria e divirta-se no Fortnite! 🚀
    `.trim(), { parse_mode: 'HTML' });
  });
};
