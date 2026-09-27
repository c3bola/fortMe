module.exports = (bot) => {
  bot.command('help', (ctx) => {
    ctx.reply(`
    <b>🤖 FortMeBot - Lista de Comandos 🤖</b>

    <b>🌿 JARDIM E TEMPORADAS:</b>
    🌿 <b>/jardim</b> (ou <b>/garden</b>) • Exibe o seu Jardim com o histórico de progresso das temporadas, dominações, ajudas e medalhas obtidas.
    🖼️ <b>/addcapa</b> • Abre a galeria para escolher a capa do seu Jardim (Membros do Clubinho podem responder a uma foto com este comando para usar capa personalizada).

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

    <b>📌 COMANDOS GERAIS:</b>
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

    <b>🔒 COMANDOS PARA ADMINISTRADORES:</b>
    - <b>/addAdmin</b> - Adiciona novos administradores 👤
    - <b>/botConfig</b> ou <b>/config</b> - Configura comandos do bot ⚙️
    - <b>/broadcast</b> - Envia mensagens para todos os grupos registrados 📢
    - <b>/registerTryhardImage</b> - Registra imagens para Try Hard e Embananado 🎞️
    - <b>/sendRank</b> - Envia o ranking atualmente processado 🏆
    - <b>/configElemental</b> - Menu de gestão global dos elementais ⚙️
    - <b>/addtemporada</b> - Adiciona e gere as temporadas dos elementais 🏆
    - <b>/addelemental</b> - Cadastra cartas (respondendo com a legenda) 🃏
    - <b>/buildcards</b> - Compila em lote as artes finais dos cards (suporta 'force' e categorias) 🖼️
    - <b>/addcapaglobal</b> - Adiciona uma capa à galeria global do Jardim (respondendo à foto) 🖼️

    <b>💡 Dica:</b> Use os comandos com sabedoria e divirta-se no Fortnite! 🚀
    `.trim(), { parse_mode: 'HTML' });
  });
};