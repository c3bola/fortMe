-- =====================================================
-- DADOS INICIAIS PARA FORTME BOT
-- =====================================================
-- Este script deve ser executado após criar o schema fnbr_community
-- Execute: mysql -u root -p fnbr_community < init_data.sql

USE `fnbr_community`;

-- =====================================================
-- 1. PERFIS DE USUÁRIO
-- =====================================================
INSERT INTO `tb_profile` (`id_profile`, `name_profile`) VALUES
(1, 'user'),
(4, 'admin');

-- =====================================================
-- 2. FEATURES DO FORTME
-- =====================================================
-- Features principais do bot
INSERT INTO `tb_fortme_features` (`id_fortme_features`, `code`, `description`, `is_active`) VALUES
(1, 'fortme', 'Comando /fortme - Sorteia skin aleatória diária', 1),
(2, 'fortgirl', 'Comando /fortgirl - Sorteia skin feminina diária', 1),
(3, 'jonesyme', 'Comando /jonesyme - Sorteia Jonesy diário', 1),
(4, 'tryhardme', 'Comando /tryhardme - Sistema tryhard/banana', 1),
(5, 'x1', 'Comando /x1 - Duelos entre usuários', 1);

-- =====================================================
-- 3. TIPOS DE CONFIGURAÇÃO (para futuro uso)
-- =====================================================
INSERT INTO `tb_config_type` (`id_config_type`, `config_key`, `description`, `status`) VALUES
(1, 'welcome_message', 'Mensagem de boas-vindas', 1),
(2, 'auto_delete_commands', 'Auto deletar comandos após uso', 0),
(3, 'ranking_schedule', 'Horário dos rankings automáticos', 0),
(4, 'vote_enabled', 'Sistema de votação habilitado', 1),
(5, 'tryhard_bonus_chance', 'Chance % de lobby tryhard bonus aparecer no X1', 1);

-- =====================================================
-- 4. TIPOS DE METADATA
-- =====================================================
INSERT INTO `tb_type_metadata` (`id_type_metadata`, `name`, `description`) VALUES
(1, 'user', 'Metadados de usuários do Telegram'),
(2, 'raffle', 'Metadados de sorteios e eventos');

-- =====================================================
-- 5. METADADOS
-- =====================================================
-- Metadados para usuários (informações do Telegram)
INSERT INTO `tb_metadata` (`id_metadata`, `fk_id_type_metadata`, `field_name`, `description`) VALUES
(1, 1, 'first_name', 'Primeiro nome do usuário no Telegram'),
(2, 1, 'last_name', 'Sobrenome do usuário no Telegram'),
(3, 1, 'username', 'Username do usuário no Telegram (@user)');

-- Metadados para sorteios
INSERT INTO `tb_metadata` (`id_metadata`, `fk_id_type_metadata`, `field_name`, `description`) VALUES
(4, 2, 'prize_description', 'Descrição do prêmio do sorteio'),
(5, 2, 'prize_value', 'Valor do prêmio em R$'),
(6, 2, 'sponsor', 'Patrocinador do sorteio'),
(7, 2, 'rules', 'Regras do sorteio'),
(8, 2, 'image_url', 'URL da imagem do prêmio');

-- =====================================================
-- 6. TIPOS DE BUCKET (para sistema financeiro futuro)
-- =====================================================
INSERT INTO `tb_bucket_type` (`id_bucket_type`, `code`, `description`, `is_active`) VALUES
(1, 'GENERAL', 'Bucket geral para receitas diversas', 1),
(2, 'SUBSCRIPTION', 'Bucket para assinaturas', 1),
(3, 'RAFFLE', 'Bucket para sorteios', 1),
(4, 'COMMISSION', 'Bucket para comissões de parceiros', 1);

-- =====================================================
-- 5. TIPOS DE TICKET (para suporte futuro)
-- =====================================================
INSERT INTO `tb_type_ticket` (`id_type_ticket`, `name`) VALUES
(1, 'Suporte Técnico'),
(2, 'Dúvidas'),
(3, 'Sugestões'),
(4, 'Reportar Bug'),
(5, 'Outro');

-- =====================================================
-- NOTES:
-- =====================================================
-- - Os IDs foram mantidos fixos para facilitar referências no código
-- - Admins devem ser inseridos manualmente ou via bot quando usarem comandos
-- - Groups/Communities são criados automaticamente quando o bot é adicionado
-- - Contents (imagens) serão adicionados via comandos de administração
-- =====================================================


