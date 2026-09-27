-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 168.75.73.222    Database: fnbr_community
-- ------------------------------------------------------
-- Server version	8.0.46-0ubuntu0.22.04.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tb_ban`
--

DROP TABLE IF EXISTS `tb_ban`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_ban` (
  `id_ban` int NOT NULL AUTO_INCREMENT,
  `banned_id_user` bigint NOT NULL,
  `applied_by_admin_ban` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `type` enum('temporary','permanent') COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_by` enum('autodetectt','welcomet','command') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_ban`),
  KEY `fk_tb_ban_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_ban_tb_user1_idx` (`banned_id_user`),
  KEY `fk_tb_ban_tb_user2_idx` (`applied_by_admin_ban`),
  CONSTRAINT `fk_tb_ban_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_ban_tb_user1` FOREIGN KEY (`banned_id_user`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_ban_tb_user2` FOREIGN KEY (`applied_by_admin_ban`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_blacklist`
--

DROP TABLE IF EXISTS `tb_blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_blacklist` (
  `id_blacklist` int NOT NULL AUTO_INCREMENT,
  `added_by_id_admin` bigint NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `added_at` datetime DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_blacklist`),
  KEY `fk_tb_blacklist_tb_user1_idx` (`added_by_id_admin`),
  CONSTRAINT `fk_tb_blacklist_tb_user1` FOREIGN KEY (`added_by_id_admin`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_bot_groups`
--

DROP TABLE IF EXISTS `tb_bot_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_bot_groups` (
  `group_id` bigint NOT NULL,
  `group_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_commands_used` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '1=ativo, 0=inativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `group_id_UNIQUE` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_broadcast_history`
--

DROP TABLE IF EXISTS `tb_broadcast_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_broadcast_history` (
  `id_broadcast` int NOT NULL AUTO_INCREMENT,
  `sent_by_admin` bigint NOT NULL,
  `message_format` json NOT NULL COMMENT 'Formato da mensagem para reuso',
  `total_groups_sent` int NOT NULL DEFAULT '0',
  `total_success` int NOT NULL DEFAULT '0',
  `total_failures` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_broadcast`),
  KEY `fk_tb_broadcast_history_tb_user1_idx` (`sent_by_admin`),
  CONSTRAINT `fk_tb_broadcast_history_tb_user1` FOREIGN KEY (`sent_by_admin`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_bucket_type`
--

DROP TABLE IF EXISTS `tb_bucket_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_bucket_type` (
  `id_bucket_type` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_bucket_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_chat_link`
--

DROP TABLE IF EXISTS `tb_chat_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_chat_link` (
  `id_chat_link` int NOT NULL AUTO_INCREMENT,
  `fk_id_support` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `invinte_link` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_chat_link`),
  UNIQUE KEY `fk_id_support_chat_link_UNIQUE` (`fk_id_support`),
  KEY `fk_tb_chat_link_tb_support1_idx` (`fk_id_support`),
  CONSTRAINT `fk_tb_chat_link_tb_support1` FOREIGN KEY (`fk_id_support`) REFERENCES `tb_support` (`id_support`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_club_policy`
--

DROP TABLE IF EXISTS `tb_club_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_club_policy` (
  `id_club_policy` int NOT NULL AUTO_INCREMENT,
  `fk_id_community` bigint NOT NULL,
  `minimum_subscription_value` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_club_policy`),
  KEY `fk_tb_club_policy_tb_community1_idx` (`fk_id_community`),
  CONSTRAINT `fk_tb_club_policy_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_club_policy_distribution`
--

DROP TABLE IF EXISTS `tb_club_policy_distribution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_club_policy_distribution` (
  `id_club_policy_distribution` int NOT NULL AUTO_INCREMENT,
  `fk_id_club_policy` int NOT NULL,
  `fk_id_bucket_type` int NOT NULL,
  `percentage` decimal(10,2) NOT NULL,
  `priority` tinyint NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_club_policy_distribution`),
  KEY `fk_tb_club_policy_distribution_tb_club_policy1_idx` (`fk_id_club_policy`),
  KEY `fk_tb_club_policy_distribution_tb_bucket_type1_idx` (`fk_id_bucket_type`),
  CONSTRAINT `fk_tb_club_policy_distribution_tb_bucket_type1` FOREIGN KEY (`fk_id_bucket_type`) REFERENCES `tb_bucket_type` (`id_bucket_type`),
  CONSTRAINT `fk_tb_club_policy_distribution_tb_club_policy1` FOREIGN KEY (`fk_id_club_policy`) REFERENCES `tb_club_policy` (`id_club_policy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_community`
--

DROP TABLE IF EXISTS `tb_community`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_community` (
  `group_id_community` bigint NOT NULL,
  `group_name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_members` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `type` enum('group','channel','log') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'group',
  `requires_subscription` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id_community`),
  UNIQUE KEY `group_id_community_UNIQUE` (`group_id_community`),
  UNIQUE KEY `group_name_community_UNIQUE` (`group_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_community_config`
--

DROP TABLE IF EXISTS `tb_community_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_community_config` (
  `id_community_config` int NOT NULL AUTO_INCREMENT,
  `fk_id_config_type` int NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `config_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_community_config`),
  KEY `fk_tb_config_type_has_tb_community_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_config_type_has_tb_community_tb_config_type1_idx` (`fk_id_config_type`),
  CONSTRAINT `fk_tb_config_type_has_tb_community_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_config_type_has_tb_community_tb_config_type1` FOREIGN KEY (`fk_id_config_type`) REFERENCES `tb_config_type` (`id_config_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_config_type`
--

DROP TABLE IF EXISTS `tb_config_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_config_type` (
  `id_config_type` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_config_type`),
  UNIQUE KEY `key_config_type_UNIQUE` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_data_user`
--

DROP TABLE IF EXISTS `tb_data_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_data_user` (
  `id_data_user` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `fk_id_metadata` int NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_data_user`),
  UNIQUE KEY `uk_data_user` (`fk_id_user`,`fk_id_metadata`),
  KEY `fk_tb_data_user_tb_metadata1_idx` (`fk_id_metadata`),
  KEY `fk_tb_data_user_tb_user1_idx` (`fk_id_user`),
  CONSTRAINT `fk_tb_data_user_tb_metadata1` FOREIGN KEY (`fk_id_metadata`) REFERENCES `tb_metadata` (`id_metadata`) ON DELETE CASCADE,
  CONSTRAINT `fk_tb_data_user_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=686 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_duel_moves`
--

DROP TABLE IF EXISTS `tb_duel_moves`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_duel_moves` (
  `id_duel_move` int NOT NULL AUTO_INCREMENT,
  `fk_id_duel` int NOT NULL,
  `fk_id_user` bigint NOT NULL,
  `move` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Jogada realizada',
  `move_order` tinyint NOT NULL COMMENT 'Ordem da jogada (1, 2, 3)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_duel_move`),
  KEY `fk_tb_duel_moves_fortme_duels1_idx` (`fk_id_duel`),
  KEY `fk_tb_duel_moves_tb_user1_idx` (`fk_id_user`),
  CONSTRAINT `fk_tb_duel_moves_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=531 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_category`
--

DROP TABLE IF EXISTS `tb_elemental_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_category` (
  `id_elemental_category` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador interno: basic, gold, candy...',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome de exibição: Basic, Gold, Candy...',
  `display_order` int NOT NULL DEFAULT '0',
  `background_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Imagem de fundo da categoria',
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '1=ativo, 0=inativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_category`),
  UNIQUE KEY `uk_elemental_category_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorias dos Sprites (Basic, Gold, Candy, Galaxy, Gem, Holofoil, Cube, Special)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_collection`
--

DROP TABLE IF EXISTS `tb_elemental_collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_collection` (
  `id_elemental_collection` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `fk_id_variant` int NOT NULL,
  `fk_id_season` int NOT NULL,
  `marked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Quando o usuário marcou como obtido',
  `is_dominated` tinyint NOT NULL DEFAULT '0' COMMENT '1=dominado, 0=não dominado',
  PRIMARY KEY (`id_elemental_collection`),
  UNIQUE KEY `uk_elemental_collection` (`fk_id_user`,`fk_id_variant`,`fk_id_season`),
  KEY `fk_elemental_collection_user_idx` (`fk_id_user`),
  KEY `fk_elemental_collection_variant_idx` (`fk_id_variant`),
  CONSTRAINT `fk_elemental_collection_user` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `fk_elemental_collection_variant` FOREIGN KEY (`fk_id_variant`) REFERENCES `tb_elemental_variant` (`id_elemental_variant`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35616 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Coleção de variantes por usuário';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_cover`
--

DROP TABLE IF EXISTS `tb_elemental_cover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_cover` (
  `id_cover` int NOT NULL AUTO_INCREMENT,
  `file_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint NOT NULL DEFAULT '0' COMMENT '1=padrão global',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cover`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Galeria de capas pré-definidas para o comando /jardim';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_help_log`
--

DROP TABLE IF EXISTS `tb_elemental_help_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_help_log` (
  `id_elemental_help_log` int NOT NULL AUTO_INCREMENT,
  `fk_helper_id` bigint NOT NULL COMMENT 'Usuário que ajudou',
  `fk_helped_id` bigint NOT NULL COMMENT 'Usuário que foi ajudado',
  `fk_group_id` bigint NOT NULL,
  `fk_id_season` int DEFAULT NULL,
  `fk_id_variant` int DEFAULT NULL COMMENT 'Variante que motivou a ajuda (NULL = genérica)',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Observação opcional',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_help_log`),
  KEY `fk_elemental_help_helper_idx` (`fk_helper_id`),
  KEY `fk_elemental_help_helped_idx` (`fk_helped_id`),
  KEY `fk_elemental_help_group_idx` (`fk_group_id`),
  KEY `fk_elemental_help_variant_idx` (`fk_id_variant`),
  KEY `fk_elemental_help_season_idx` (`fk_id_season`),
  CONSTRAINT `fk_elemental_help_group` FOREIGN KEY (`fk_group_id`) REFERENCES `tb_bot_groups` (`group_id`),
  CONSTRAINT `fk_elemental_help_helped` FOREIGN KEY (`fk_helped_id`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `fk_elemental_help_helper` FOREIGN KEY (`fk_helper_id`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE,
  CONSTRAINT `fk_elemental_help_season` FOREIGN KEY (`fk_id_season`) REFERENCES `tb_elemental_season` (`id_season`) ON DELETE SET NULL,
  CONSTRAINT `fk_elemental_help_variant` FOREIGN KEY (`fk_id_variant`) REFERENCES `tb_elemental_variant` (`id_elemental_variant`)
) ENGINE=InnoDB AUTO_INCREMENT=270 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log de ajudas entre colecionadores';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_rarity`
--

DROP TABLE IF EXISTS `tb_elemental_rarity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_rarity` (
  `id_elemental_rarity` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome de exibição: Common, Rare, Epic, Legendary',
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cor HEX para exibição: #FFFFFF',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_rarity`),
  UNIQUE KEY `uk_elemental_rarity_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Raridades dos Sprites Elementais';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_season`
--

DROP TABLE IF EXISTS `tb_elemental_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_season` (
  `id_season` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ex: C7T3',
  `chapter` int NOT NULL COMMENT 'Capítulo: 7',
  `season_number` int NOT NULL COMMENT 'Temporada: 3',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome: No corre',
  `is_current` tinyint NOT NULL DEFAULT '0' COMMENT '1=ativa, 0=inativa',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_season`),
  UNIQUE KEY `uk_elemental_season_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Histórico e vigência de temporadas do Fortnite';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_season_variant`
--

DROP TABLE IF EXISTS `tb_elemental_season_variant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_season_variant` (
  `id_season_variant` int NOT NULL AUTO_INCREMENT,
  `fk_id_season` int NOT NULL,
  `fk_id_variant` int NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '1=ativa no jogo, 0=inativa/cofre',
  `activated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `vaulted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_season_variant`),
  UNIQUE KEY `uk_season_variant` (`fk_id_season`,`fk_id_variant`),
  KEY `fk_season_variant_season_idx` (`fk_id_season`),
  KEY `fk_season_variant_variant_idx` (`fk_id_variant`),
  CONSTRAINT `fk_season_variant_season` FOREIGN KEY (`fk_id_season`) REFERENCES `tb_elemental_season` (`id_season`) ON DELETE CASCADE,
  CONSTRAINT `fk_season_variant_variant` FOREIGN KEY (`fk_id_variant`) REFERENCES `tb_elemental_variant` (`id_elemental_variant`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=581 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vigência e disponibilidade de variantes em cada temporada';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_sprite`
--

DROP TABLE IF EXISTS `tb_elemental_sprite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_sprite` (
  `id_elemental_sprite` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Identificador url-safe: duck, zero-point, burnt-peanut',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nome de exibição: Duck, Zero Point, Burnt Peanut',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Lore/descrição do personagem',
  `display_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '1=ativo, 0=inativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_sprite`),
  UNIQUE KEY `uk_elemental_sprite_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sprites Elementais — personagens únicos (Duck, Punk, Ghost...)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_user_config`
--

DROP TABLE IF EXISTS `tb_elemental_user_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_user_config` (
  `id_elemental_user_config` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `accept_help_requests` tinyint NOT NULL DEFAULT '1' COMMENT '1=aceita pedidos de ajuda',
  `allow_private_messages` tinyint NOT NULL DEFAULT '1' COMMENT '1=aceita mensagens privadas',
  `allow_group_mention` tinyint NOT NULL DEFAULT '1' COMMENT '1=permite marcação no grupo',
  `collection_image_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File ID do mosaico em cache',
  `custom_cover_file_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_elemental_user_config`),
  UNIQUE KEY `uk_elemental_user_config` (`fk_id_user`),
  KEY `fk_elemental_user_config_user_idx` (`fk_id_user`),
  CONSTRAINT `fk_elemental_user_config_user` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações do módulo Elementais por usuário';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_elemental_variant`
--

DROP TABLE IF EXISTS `tb_elemental_variant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_elemental_variant` (
  `id_elemental_variant` int NOT NULL AUTO_INCREMENT,
  `fk_id_sprite` int NOT NULL,
  `fk_id_category` int NOT NULL,
  `fk_id_rarity` int DEFAULT NULL COMMENT 'Raridade específica desta variante',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Como/onde obter esta variante',
  `summon_cost` int DEFAULT NULL COMMENT 'Custo de invocação desta variante',
  `drop_chance` decimal(5,2) DEFAULT NULL COMMENT 'Chance de obtenção desta variante (%)',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Caminho da imagem principal transparente (Render)',
  `file_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File ID do Telegram em cache para envio instantâneo',
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '1=ativo, 0=inativo',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `telegram_file_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File ID retornado pelo Telegram para reutilização da imagem',
  `telegram_file_unique_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'File Unique ID retornado pelo Telegram',
  PRIMARY KEY (`id_elemental_variant`),
  UNIQUE KEY `uk_elemental_variant` (`fk_id_sprite`,`fk_id_category`),
  KEY `fk_elemental_variant_sprite_idx` (`fk_id_sprite`),
  KEY `fk_elemental_variant_category_idx` (`fk_id_category`),
  KEY `fk_elemental_variant_rarity_idx` (`fk_id_rarity`),
  CONSTRAINT `fk_elemental_variant_category` FOREIGN KEY (`fk_id_category`) REFERENCES `tb_elemental_category` (`id_elemental_category`) ON DELETE RESTRICT,
  CONSTRAINT `fk_elemental_variant_rarity` FOREIGN KEY (`fk_id_rarity`) REFERENCES `tb_elemental_rarity` (`id_elemental_rarity`) ON DELETE SET NULL,
  CONSTRAINT `fk_elemental_variant_sprite` FOREIGN KEY (`fk_id_sprite`) REFERENCES `tb_elemental_sprite` (`id_elemental_sprite`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Variantes: combinação de Sprite e Categoria (Candy Duck, Galaxy Punk...)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_extra`
--

DROP TABLE IF EXISTS `tb_extra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_extra` (
  `id_extra` int NOT NULL AUTO_INCREMENT,
  `created_by_id_admin` bigint NOT NULL,
  `keyword` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_extra`),
  UNIQUE KEY `keyword_UNIQUE` (`keyword`),
  KEY `fk_tb_extra_tb_user1_idx` (`created_by_id_admin`),
  CONSTRAINT `fk_tb_extra_tb_user1` FOREIGN KEY (`created_by_id_admin`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_contents`
--

DROP TABLE IF EXISTS `tb_fortme_contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_contents` (
  `id_fortme_contents` int NOT NULL AUTO_INCREMENT,
  `fk_id_features` int NOT NULL,
  `created_by` bigint NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_fortme_contents`),
  KEY `fk_tb_fortme_contents_tb_fortme_features1_idx` (`fk_id_features`),
  KEY `fk_tb_fortme_contents_tb_user1_idx` (`created_by`),
  CONSTRAINT `fk_tb_fortme_contents_tb_fortme_features1` FOREIGN KEY (`fk_id_features`) REFERENCES `tb_fortme_features` (`id_fortme_features`),
  CONSTRAINT `fk_tb_fortme_contents_tb_user1` FOREIGN KEY (`created_by`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_daily_usage`
--

DROP TABLE IF EXISTS `tb_fortme_daily_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_daily_usage` (
  `id_fortme_daily_usage` int NOT NULL AUTO_INCREMENT,
  `fk_group_id` bigint NOT NULL,
  `fk_id_features` int NOT NULL,
  `fk_id_contents` int NOT NULL,
  `fk_id_user` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `used_date` date NOT NULL,
  `percentage_value` decimal(5,2) DEFAULT NULL COMMENT 'Percentual para tryhardme (0-100)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_fortme_daily_usage`),
  UNIQUE KEY `uk_fortme_daily_usage` (`fk_id_features`,`fk_id_user`,`used_date`),
  KEY `fk_tb_fortme_daily_usage_tb_fortme_features1_idx` (`fk_id_features`),
  KEY `fk_tb_fortme_daily_usage_tb_fortme_contents1_idx` (`fk_id_contents`),
  KEY `fk_tb_fortme_daily_usage_tb_user1_idx` (`fk_id_user`),
  KEY `fk_tb_fortme_daily_usage_tb_bot_groups1_idx` (`fk_group_id`),
  CONSTRAINT `fk_tb_fortme_daily_usage_tb_bot_groups1` FOREIGN KEY (`fk_group_id`) REFERENCES `tb_bot_groups` (`group_id`),
  CONSTRAINT `fk_tb_fortme_daily_usage_tb_fortme_contents1` FOREIGN KEY (`fk_id_contents`) REFERENCES `tb_fortme_contents` (`id_fortme_contents`),
  CONSTRAINT `fk_tb_fortme_daily_usage_tb_fortme_features1` FOREIGN KEY (`fk_id_features`) REFERENCES `tb_fortme_features` (`id_fortme_features`),
  CONSTRAINT `fk_tb_fortme_daily_usage_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB AUTO_INCREMENT=1698 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_duels`
--

DROP TABLE IF EXISTS `tb_fortme_duels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_duels` (
  `id_fortme_duels` int NOT NULL AUTO_INCREMENT,
  `fk_group_id` bigint NOT NULL,
  `challenger_id` bigint NOT NULL,
  `opponent_id` bigint NOT NULL,
  `winner_id` bigint DEFAULT NULL COMMENT 'NULL se duelo abandonado',
  `status` enum('started','completed','abandoned') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_tryhard` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_fortme_duels`),
  KEY `fk_fortme_duels_tb_user1_idx` (`challenger_id`),
  KEY `fk_fortme_duels_tb_user2_idx` (`opponent_id`),
  KEY `fk_fortme_duels_tb_user3_idx` (`winner_id`),
  KEY `fk_fortme_duels_tb_bot_groups1_idx` (`fk_group_id`),
  CONSTRAINT `fk_fortme_duels_tb_bot_groups1` FOREIGN KEY (`fk_group_id`) REFERENCES `tb_bot_groups` (`group_id`),
  CONSTRAINT `fk_fortme_duels_tb_user1` FOREIGN KEY (`challenger_id`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_fortme_duels_tb_user2` FOREIGN KEY (`opponent_id`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_fortme_duels_tb_user3` FOREIGN KEY (`winner_id`) REFERENCES `tb_user` (`id_user`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=284 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_features`
--

DROP TABLE IF EXISTS `tb_fortme_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_features` (
  `id_fortme_features` int NOT NULL AUTO_INCREMENT,
  `code` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_fortme_features`),
  UNIQUE KEY `tb_fortme_features_UNIQUE` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_user_stats`
--

DROP TABLE IF EXISTS `tb_fortme_user_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_user_stats` (
  `fk_id_user` bigint NOT NULL,
  `fk_group_id` bigint NOT NULL,
  `wins` int NOT NULL DEFAULT '0',
  `duels_started` int NOT NULL DEFAULT '0',
  `duels_completed` int NOT NULL DEFAULT '0',
  `duels_abandoned` int NOT NULL DEFAULT '0',
  `tryhard` int NOT NULL DEFAULT '0',
  `banana` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`fk_id_user`,`fk_group_id`),
  KEY `fk_tb_fortme_user_stats_tb_user1_idx` (`fk_id_user`),
  KEY `fk_tb_fortme_user_stats_tb_bot_groups1_idx` (`fk_group_id`),
  CONSTRAINT `fk_tb_fortme_user_stats_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_fortme_votes`
--

DROP TABLE IF EXISTS `tb_fortme_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_fortme_votes` (
  `id_fortme_votes` int NOT NULL AUTO_INCREMENT,
  `voter_id` bigint NOT NULL,
  `fk_daily_usage_id` int NOT NULL,
  `vote` enum('heart','hat') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_fortme_votes`),
  UNIQUE KEY `uk_fortme_votes` (`fk_daily_usage_id`,`voter_id`),
  KEY `fk_tb_fortme_votes_tb_fortme_daily_usage1_idx` (`fk_daily_usage_id`),
  KEY `fk_tb_fortme_votes_tb_user1_idx` (`voter_id`),
  CONSTRAINT `fk_tb_fortme_votes_tb_fortme_daily_usage1` FOREIGN KEY (`fk_daily_usage_id`) REFERENCES `tb_fortme_daily_usage` (`id_fortme_daily_usage`) ON DELETE CASCADE,
  CONSTRAINT `fk_tb_fortme_votes_tb_user1` FOREIGN KEY (`voter_id`) REFERENCES `tb_user` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=466 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_gifs`
--

DROP TABLE IF EXISTS `tb_gifs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_gifs` (
  `id_tb_gifs` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `delete_message` tinyint DEFAULT NULL,
  PRIMARY KEY (`id_tb_gifs`),
  KEY `fk_tb_gifs_tb_user1_idx` (`fk_id_user`),
  CONSTRAINT `fk_tb_gifs_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_ledger`
--

DROP TABLE IF EXISTS `tb_ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_ledger` (
  `id_ledger` int NOT NULL AUTO_INCREMENT,
  `fk_id_wallet_bucket` int NOT NULL,
  `reversed_ledger_id` int DEFAULT NULL,
  `operation_type` enum('CREDIT','DEBIT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `status` enum('CONFIRMED','PENDING','REVERSED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_type` enum('SUBSCRIPTION_PAYMENT','SUBSCRIPTION_REFUND','SUBSCRIPTION_EXTRA_VALUE','RAFFLE_ENTRY','RAFFLE_PRIZE_PAYMENT','RAFFLE_REFUND','PARTNER_COMMISSION','PARTNER_PAYMENT','MANUAL_ADJUSTMENT','SYSTEM_ADJUSTMENT','INITIAL_BALANCE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source_id` int DEFAULT NULL COMMENT 'source_id\\nID do registro que originou esta operação financeira.\\nO significado depende do source_type.\\nEx.:\\n\\nSUBSCRIPTION_PAYMENT → id do pagamento da assinatura\\n\\nRAFFLE_PRIZE_PAYMENT → id do sorteio/prêmio\\n\\nMANUAL_ADJUSTMENT → id do ajuste manual\\n\\nEste campo é obrigatório e imutável, sendo utilizado para auditoria e estornos.',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ledger`),
  UNIQUE KEY `reversed_ledger_id_UNIQUE` (`reversed_ledger_id`),
  KEY `fk_tb_ledger_tb_wallet_bucket1_idx` (`fk_id_wallet_bucket`),
  KEY `fk_tb_ledger_tb_ledger1_idx` (`reversed_ledger_id`),
  CONSTRAINT `fk_tb_ledger_tb_ledger1` FOREIGN KEY (`reversed_ledger_id`) REFERENCES `tb_ledger` (`id_ledger`),
  CONSTRAINT `fk_tb_ledger_tb_wallet_bucket1` FOREIGN KEY (`fk_id_wallet_bucket`) REFERENCES `tb_wallet_bucket` (`id_wallet_bucket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_media_release`
--

DROP TABLE IF EXISTS `tb_media_release`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_media_release` (
  `id_media_release` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `source` enum('join_rules','command','manual','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions_granted` tinyint NOT NULL DEFAULT '1',
  `granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_media_release`),
  KEY `fk_tb_media_release_tb_user1_idx` (`fk_id_user`),
  KEY `fk_tb_media_release_tb_community1_idx` (`fk_id_community`),
  CONSTRAINT `fk_tb_media_release_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_media_release_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_metadata`
--

DROP TABLE IF EXISTS `tb_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_metadata` (
  `id_metadata` int NOT NULL AUTO_INCREMENT,
  `fk_id_type_metadata` int NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_metadata`),
  UNIQUE KEY `uk_metadata_field` (`fk_id_type_metadata`,`field_name`),
  KEY `fk_tb_metadata_tb_type_metadata1_idx` (`fk_id_type_metadata`),
  CONSTRAINT `fk_tb_metadata_tb_type_metadata1` FOREIGN KEY (`fk_id_type_metadata`) REFERENCES `tb_type_metadata` (`id_type_metadata`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_mute`
--

DROP TABLE IF EXISTS `tb_mute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_mute` (
  `id_mute` int NOT NULL AUTO_INCREMENT,
  `muted_id_user` bigint NOT NULL,
  `applied_by_admin_id_user` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_mute`),
  KEY `fk_tb_mute_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_mute_tb_user1_idx` (`muted_id_user`),
  KEY `fk_tb_mute_tb_user2_idx` (`applied_by_admin_id_user`),
  CONSTRAINT `fk_tb_mute_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_mute_tb_user1` FOREIGN KEY (`muted_id_user`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_mute_tb_user2` FOREIGN KEY (`applied_by_admin_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_partner`
--

DROP TABLE IF EXISTS `tb_partner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_partner` (
  `id_partner` bigint NOT NULL,
  `promoted_by_admin_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_partner`),
  KEY `fk_tb_partner_tb_user1_idx` (`id_partner`),
  KEY `fk_tb_partner_tb_user2_idx` (`promoted_by_admin_id`),
  CONSTRAINT `fk_tb_partner_tb_user1` FOREIGN KEY (`id_partner`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_partner_tb_user2` FOREIGN KEY (`promoted_by_admin_id`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_partner_post`
--

DROP TABLE IF EXISTS `tb_partner_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_partner_post` (
  `id_partner_post` int NOT NULL AUTO_INCREMENT,
  `fk_id_partner` bigint NOT NULL,
  `message_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_partner_post`),
  KEY `fk_tb_partner_post_tb_partner1_idx` (`fk_id_partner`),
  CONSTRAINT `fk_tb_partner_post_tb_partner1` FOREIGN KEY (`fk_id_partner`) REFERENCES `tb_partner` (`id_partner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_profile`
--

DROP TABLE IF EXISTS `tb_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_profile` (
  `id_profile` int NOT NULL AUTO_INCREMENT,
  `name_profile` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_profile`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_raffle`
--

DROP TABLE IF EXISTS `tb_raffle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_raffle` (
  `id_raffle` int NOT NULL AUTO_INCREMENT,
  `created_by_admin_id` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `status` enum('DRAFT','OPEN','CLOSED','DRAWN','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Sorteio só aceita entradas quando status = OPEN',
  `draw_date` date NOT NULL,
  `winners_quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_raffle`),
  KEY `fk_tb_raffle_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_raffle_tb_user1_idx` (`created_by_admin_id`),
  CONSTRAINT `fk_tb_raffle_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_raffle_tb_user1` FOREIGN KEY (`created_by_admin_id`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_raffle_entry`
--

DROP TABLE IF EXISTS `tb_raffle_entry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_raffle_entry` (
  `id_raffle_entry` int NOT NULL AUTO_INCREMENT,
  `fk_id_raffle` int NOT NULL,
  `fk_id_user` bigint NOT NULL,
  `base_weight` decimal(10,4) NOT NULL,
  `final_weight` decimal(10,4) DEFAULT NULL,
  `is_winner` tinyint DEFAULT '0',
  `win_position` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_raffle_entry`),
  KEY `fk_tb_raffle_entry_tb_raffle1_idx` (`fk_id_raffle`),
  KEY `fk_tb_raffle_entry_tb_user1_idx` (`fk_id_user`),
  CONSTRAINT `fk_tb_raffle_entry_tb_raffle1` FOREIGN KEY (`fk_id_raffle`) REFERENCES `tb_raffle` (`id_raffle`),
  CONSTRAINT `fk_tb_raffle_entry_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_raffle_metadata`
--

DROP TABLE IF EXISTS `tb_raffle_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_raffle_metadata` (
  `id_raffle_metadata` int NOT NULL AUTO_INCREMENT,
  `tb_raffle_id_raffle` int NOT NULL,
  `fk_id_metadata` int NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_raffle_metadata`),
  KEY `fk_tb_raffle_metadata_tb_raffle1_idx` (`tb_raffle_id_raffle`),
  KEY `fk_tb_raffle_metadata_tb_metadata1_idx` (`fk_id_metadata`),
  CONSTRAINT `fk_tb_raffle_metadata_tb_metadata1` FOREIGN KEY (`fk_id_metadata`) REFERENCES `tb_metadata` (`id_metadata`),
  CONSTRAINT `fk_tb_raffle_metadata_tb_raffle1` FOREIGN KEY (`tb_raffle_id_raffle`) REFERENCES `tb_raffle` (`id_raffle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_raffle_user_stats`
--

DROP TABLE IF EXISTS `tb_raffle_user_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_raffle_user_stats` (
  `id_raffle_user_stats` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `total_entries` int NOT NULL DEFAULT '0',
  `total_wins` int NOT NULL DEFAULT '0',
  `first_win_at` date DEFAULT NULL,
  `last_win_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_raffle_user_stats`),
  KEY `fk_tb_raffle_user_stats_tb_user1_idx` (`fk_id_user`),
  KEY `fk_tb_raffle_user_stats_tb_community1_idx` (`fk_id_community`),
  CONSTRAINT `fk_tb_raffle_user_stats_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_raffle_user_stats_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_source_partner`
--

DROP TABLE IF EXISTS `tb_source_partner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_source_partner` (
  `id_source_partner` int NOT NULL AUTO_INCREMENT,
  `fk_id_partner` bigint NOT NULL,
  `name_source` enum('YouTube','Twitch','Twitter','Facebook','Instagram','TikTok','VK') COLLATE utf8mb4_unicode_ci NOT NULL,
  `url_source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_source_partner`),
  KEY `fk_tb_source_partner_tb_partner1_idx` (`fk_id_partner`),
  CONSTRAINT `fk_tb_source_partner_tb_partner1` FOREIGN KEY (`fk_id_partner`) REFERENCES `tb_partner` (`id_partner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_subscription`
--

DROP TABLE IF EXISTS `tb_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_subscription` (
  `id_subscription` int NOT NULL AUTO_INCREMENT,
  `fk_id_user` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','CANCELED','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_subscription`),
  KEY `fk_tb_subscription_tb_user1_idx` (`fk_id_user`),
  KEY `fk_tb_subscription_tb_community1_idx` (`fk_id_community`),
  CONSTRAINT `fk_tb_subscription_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_subscription_tb_user1` FOREIGN KEY (`fk_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_subscription_payment`
--

DROP TABLE IF EXISTS `tb_subscription_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_subscription_payment` (
  `id_subscription_payment` int NOT NULL AUTO_INCREMENT,
  `fk_id_subscription` int NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `months_paid` tinyint NOT NULL,
  `payment_method` enum('PIX','GIFT','MANUAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','PAID','FAILED','REFUNDED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_id_subscription` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `paid_at` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_subscription_payment`),
  KEY `fk_tb_subscription_payment_tb_subscription1_idx` (`fk_id_subscription`),
  CONSTRAINT `fk_tb_subscription_payment_tb_subscription1` FOREIGN KEY (`fk_id_subscription`) REFERENCES `tb_subscription` (`id_subscription`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_support`
--

DROP TABLE IF EXISTS `tb_support`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_support` (
  `id_support` int NOT NULL AUTO_INCREMENT,
  `requester_id_user` bigint NOT NULL,
  `started_by_fk_id_admin` bigint NOT NULL,
  `closed_by_fk_id_admin` bigint NOT NULL,
  `fk_id_type_ticket` int NOT NULL,
  `status` tinyint DEFAULT NULL COMMENT '1 = ABERTO\\n2 = EM_ATENDIMENTO\\n3 = AGUARDANDO_CLIENTE\\n4 = FECHADO\\n',
  `created_at_support` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_support`),
  KEY `fk_tb_support_tb_type_ticket1_idx` (`fk_id_type_ticket`),
  KEY `fk_tb_support_tb_user1_idx` (`requester_id_user`),
  KEY `fk_tb_support_tb_user2_idx` (`started_by_fk_id_admin`),
  KEY `fk_tb_support_tb_user3_idx` (`closed_by_fk_id_admin`),
  CONSTRAINT `fk_tb_support_tb_type_ticket1` FOREIGN KEY (`fk_id_type_ticket`) REFERENCES `tb_type_ticket` (`id_type_ticket`),
  CONSTRAINT `fk_tb_support_tb_user1` FOREIGN KEY (`requester_id_user`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_support_tb_user2` FOREIGN KEY (`started_by_fk_id_admin`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_support_tb_user3` FOREIGN KEY (`closed_by_fk_id_admin`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_type_metadata`
--

DROP TABLE IF EXISTS `tb_type_metadata`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_type_metadata` (
  `id_type_metadata` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_type_metadata`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_type_ticket`
--

DROP TABLE IF EXISTS `tb_type_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_type_ticket` (
  `id_type_ticket` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id_type_ticket`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_user`
--

DROP TABLE IF EXISTS `tb_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_user` (
  `id_user` bigint NOT NULL,
  `fk_id_profile` int NOT NULL,
  PRIMARY KEY (`id_user`),
  KEY `fk_tb_user_tb_profile1_idx` (`fk_id_profile`),
  CONSTRAINT `fk_tb_user_tb_profile1` FOREIGN KEY (`fk_id_profile`) REFERENCES `tb_profile` (`id_profile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_wallet`
--

DROP TABLE IF EXISTS `tb_wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_wallet` (
  `id_wallet` int NOT NULL AUTO_INCREMENT,
  `fk_id_community` bigint NOT NULL,
  `name_wallet` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_wallet`),
  KEY `fk_tb_wallet_tb_community1_idx` (`fk_id_community`),
  CONSTRAINT `fk_tb_wallet_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_wallet_bucket`
--

DROP TABLE IF EXISTS `tb_wallet_bucket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_wallet_bucket` (
  `id_wallet_bucket` int NOT NULL AUTO_INCREMENT,
  `fk_id_wallet` int NOT NULL,
  `fk_id_bucket_type` int NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `current_balance` decimal(10,2) NOT NULL,
  `is_active` tinyint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_wallet_bucket`),
  KEY `fk_tb_wallet_bucket_tb_wallet1_idx` (`fk_id_wallet`),
  KEY `fk_tb_wallet_bucket_tb_bucket_type1_idx` (`fk_id_bucket_type`),
  CONSTRAINT `fk_tb_wallet_bucket_tb_bucket_type1` FOREIGN KEY (`fk_id_bucket_type`) REFERENCES `tb_bucket_type` (`id_bucket_type`),
  CONSTRAINT `fk_tb_wallet_bucket_tb_wallet1` FOREIGN KEY (`fk_id_wallet`) REFERENCES `tb_wallet` (`id_wallet`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_warn`
--

DROP TABLE IF EXISTS `tb_warn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_warn` (
  `id_warn` int NOT NULL AUTO_INCREMENT,
  `warned_id_user` bigint NOT NULL,
  `applied_by_admin` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_warn`),
  KEY `fk_tb_warn_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_warn_tb_user1_idx` (`warned_id_user`),
  KEY `fk_tb_warn_tb_user2_idx` (`applied_by_admin`),
  CONSTRAINT `fk_tb_warn_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_warn_tb_user1` FOREIGN KEY (`warned_id_user`) REFERENCES `tb_user` (`id_user`),
  CONSTRAINT `fk_tb_warn_tb_user2` FOREIGN KEY (`applied_by_admin`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tb_welcome`
--

DROP TABLE IF EXISTS `tb_welcome`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tb_welcome` (
  `id_welcome` int NOT NULL AUTO_INCREMENT,
  `fk_user_id_user` bigint NOT NULL,
  `fk_id_community` bigint NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `welcome_message_id` bigint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_welcome`),
  UNIQUE KEY `idx_unique_user_community` (`fk_id_community`,`fk_user_id_user`),
  KEY `fk_tb_user_has_tb_community_tb_community1_idx` (`fk_id_community`),
  KEY `fk_tb_welcome_tb_user1_idx` (`fk_user_id_user`),
  CONSTRAINT `fk_tb_user_has_tb_community_tb_community1` FOREIGN KEY (`fk_id_community`) REFERENCES `tb_community` (`group_id_community`),
  CONSTRAINT `fk_tb_welcome_tb_user1` FOREIGN KEY (`fk_user_id_user`) REFERENCES `tb_user` (`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-20 20:55:34
