module.exports = (bot) => {
  bot.command('help', (ctx) => {
    ctx.reply(`
    <b>🤖 FortMeBot - Lista de Comandos 🤖</b>

    <b>📌 Comandos para Usuários:</b>
    - <b>/help</b> - Exibe esta lista de comandos 📝
    - <b>/fortme</b> - Descubra sua sorte do dia no Fortnite 🎲
    - <b>/fortgirl</b> - Veja as skins disponíveis e avalie 👩‍🎤
    - <b>/jonesyme</b> - Descubra mais sobre o Jonesy no Fortnite 🧔
    - <b>/tryhardme</b> - Descubra se você é Try Hard ou Embananado hoje 💪🍌
    - <b>/x1</b> - Desafie alguém para um duelo X1 (responda a msg do oponente) ⚔️
    - <b>/ranking</b> - Veja rankings diários por categoria 🏆
        • <b>/ranking x1</b> — ranking de vitórias X1
        • <b>/ranking fortme</b> — ranking fortme
        • <b>/ranking fortgirl</b> — ranking fortgirl
        • <b>/ranking jonesyme</b> — ranking jonesyme
        • <b>/ranking tryhard</b> — ranking tryhard

    <b>🔒 Comandos para Administradores:</b>
    - <b>/addAdmin</b> - Adiciona novos administradores 👤
    - <b>/rmAdmin</b> - Remove administradores (apenas perfil 5) 🚫
    - <b>/botConfig</b> ou <b>/config</b> - Configura comandos do bot ⚙️
    - <b>/broadcast</b> - Envia mensagens para todos os grupos registrados 📢
    - <b>/list</b> - Lista informações:
        • <b>admin</b> — administradores
        • <b>group</b> — grupos registrados
        • <b>config</b> — configurações do bot
        • <b>jonesy</b> — imagens Jonesy
        • <b>fortGirls</b> — imagens FortGirls
        • <b>fortMe</b> — imagens FortMe
    - <b>/manageFortGirls</b> - Gerencia as skins registradas 👩‍🎤
    - <b>/manageJonesy</b> - Gerencia as skins do Jonesy 🧔
    - <b>/registerFortGirl</b> - Registra skins para o comando FortGirl 👗
    - <b>/registerFortJonesy</b> - Registra imagens para o comando FortJonesy 🧔
    - <b>/registerFortMe</b> - Registra imagens para o comando FortMe 🎮
    - <b>/registerTryhardImage</b> - Registra imagens para Try Hard e Embananado 🎞️
    - <b>/rm</b> - Remove um item de jonesy, fortGirls ou fortMe ❌

    <b>💡 Dica:</b> Use os comandos com sabedoria e divirta-se no Fortnite! 🚀
    `.trim(), { parse_mode: 'HTML' });
  });
};
