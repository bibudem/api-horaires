-- MySQL dump 10.13  Distrib 8.0.17, for Win64 (x86_64)
--
-- Host: your-host.example.ca    Database: horaires
-- ------------------------------------------------------
-- Server version	5.7.33

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
-- Table structure for table `production`
--

DROP TABLE IF EXISTS `production`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `type` char(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `session` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `bibliotheque` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `jour` varchar(8) COLLATE utf8_unicode_ci DEFAULT NULL,
  `debut1` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fin1` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `debut2` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fin2` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `periode` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `service` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sommaire` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date-bibliothèque-service` (`date`,`bibliotheque`,`service`),
  KEY `date` (`date`),
  KEY `bibliotheque` (`bibliotheque`)
) ENGINE=InnoDB AUTO_INCREMENT=3178993 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sauvegarde`
--

DROP TABLE IF EXISTS `sauvegarde`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sauvegarde` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `type` char(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `session` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `bibliotheque` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `jour` varchar(8) COLLATE utf8_unicode_ci DEFAULT NULL,
  `debut1` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fin1` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `debut2` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `fin2` varchar(5) COLLATE utf8_unicode_ci DEFAULT NULL,
  `periode` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `service` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `date-bibliothèque` (`date`,`bibliotheque`),
  KEY `date` (`date`),
  KEY `bibliotheque` (`bibliotheque`)
) ENGINE=InnoDB AUTO_INCREMENT=145206 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'horaires'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `sauvegarde` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8 */ ;;
/*!50003 SET character_set_results = utf8 */ ;;
/*!50003 SET collation_connection  = utf8_general_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`remillc`@`132.204.52.60`*/ /*!50106 EVENT `sauvegarde` ON SCHEDULE EVERY 1 DAY STARTS '2014-05-02 00:00:01' ON COMPLETION NOT PRESERVE ENABLE COMMENT 'Sauvegarde des horaires passés.' DO -- Sauvegarde des horaires antérieures à aujourd'hui
		call sauvegarde() */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'horaires'
--
/*!50003 DROP PROCEDURE IF EXISTS `sauvegarde` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remillc`@`132.204.52.60` PROCEDURE `sauvegarde`()
BEGIN
	-- Copie des données antérieures au jour courant dans la table 'sauvegarde'
    SET @dateDebut = CURDATE() - INTERVAL 365 DAY;
	INSERT INTO `sauvegarde`
    (`type`, `session`, `date`, `bibliotheque`, `jour`, `debut1`, `fin1`, `debut2`, `fin2`, `periode`, `service`)
    SELECT p.type, p.session, p.date, p.bibliotheque, p.jour, p.debut1, p.fin1, p.debut2, p.fin2, p.periode, p.service
		FROM production AS p
		WHERE p.date < @dateDebut
    ON DUPLICATE KEY UPDATE 
        type = p.type,
        session = p.session,
        jour = p.jour,
        debut1 = p.debut1,
        fin1 = p.fin1,
        debut2 = p.debut2,
        fin2 = p.fin2,
        periode = p.periode;

	-- Supression des données antérieures au jour courant de la table 'production'
	DELETE 
		FROM production 
		WHERE date < @dateDebut;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-02-27 11:48:49
