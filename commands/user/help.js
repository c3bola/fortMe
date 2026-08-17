module.exports = (bot) => {
  bot.command('help', (ctx) => {
    ctx.reply(`
    <b>🤖 FortMeBot - Lista de Comandos 🤖</b>

    <b>🎮 COMANDOS PARA ELEMENTAIS:</b>
    📦 <b>/colecao</b> • Gera e exibe uma imagem em mosaico (card) contendo todos os sprites elementais que você já obteve e marcou na sua coleção.
    🌟 <b>/elementais</b> (ou <b>/sprites</b>) • Inicia o painel interativo de exploração e marcação. Permite navegar por categorias, visualizar fichas e alternar rapidamente quais elementais possui.
    🔍 <b>/sprite [nome]</b> • Busca diretamente a ficha de um elemental pelo nome, informando raridade, probabilidade de obtenção e imagem detalhada (Render).
    📊 <b>/estatisticas</b> • Exibe o seu progresso geral e a divisão exata de obtenção de sprites detalhada por cada categoria, acompanhada de barras visuais.
    👤 <b>/perfil</b> • Mostra um resumo completo da sua conta (estatísticas, progresso, contagem de itens) além de atalhos e o status das suas configurações.
    ⚙️ <b>/configsprites</b> • Exibe o painel interativo onde você pode ativar ou desativar o recebimento de DMs, pedidos de ajuda ou liberações de menções em grupos.
    🛡 <b>/guardioes</b> <i>(Exclusivo para Grupos)</i> • Mostra o ranking da comunidade com os membros que mais ajudaram outros colecionadores a obterem seus elementais.
    📰 <b>/diario</b> <i>(Exclusivo para Grupos)</i> • Exibe o log de atividades recente, listando quais colecionadores marcaram novos elementais ou obtiveram conquistas.
    🆘 <b>/ajuda [nome] [categoria]</b> • Busca no bot quais jogadores possuem um sprite específico e que estejam com o recebimento de ajuda ativado para que você possa contatá-los.
    🎉 <b>/agradecer</b> <i>(Em resposta a uma mensagem)</i> • Utilizado como menção em grupo respondendo a quem te auxiliou com a ficha. Registra o ato no log de ajudas do Guardião.
⚖️ <b>/comparar [@username ou resposta]</b> • Compara o seu progresso de coleção com o de outro membro, indicando quantos sprites você tem, quantos ele tem, itens em comum e faltando.

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
