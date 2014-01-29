-- Adminer 3.6.1 MySQL dump

SET NAMES utf8;
SET foreign_key_checks = 0;
SET time_zone = 'SYSTEM';
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP DATABASE IF EXISTS `p18`;
CREATE DATABASE `p18` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `p18`;

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `postid` int(11) NOT NULL,
  `from` int(11) NOT NULL,
  `message` text NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `invites`;
CREATE TABLE `invites` (
  `id` tinytext NOT NULL,
  `from` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `mentions`;
CREATE TABLE `mentions` (
  `user` int(11) NOT NULL,
  `postid` int(11) NOT NULL,
  `time` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `networks`;
CREATE TABLE `networks` (
  `id` varchar(20) NOT NULL,
  `title` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `newsletter`;
CREATE TABLE `newsletter` (
  `email` tinytext NOT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` int(11) NOT NULL,
  `to` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `time` int(11) NOT NULL,
  `body` text NOT NULL,
  `action` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `postid` int(11) NOT NULL,
  `tag` tinytext NOT NULL,
  `time` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `timeline`;
CREATE TABLE `timeline` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` int(11) NOT NULL,
  `network` varchar(20) NOT NULL DEFAULT '0',
  `type` int(11) NOT NULL DEFAULT '0',
  `meta` tinytext,
  `time` int(11) NOT NULL,
  `public` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `origid` int(11) DEFAULT NULL,
  `via` int(11) DEFAULT NULL,
  `commentcount` int(11) DEFAULT NULL,
  `modified` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `modified` (`modified`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` tinytext,
  `email` tinytext NOT NULL,
  `password` tinytext NOT NULL,
  `displayname` tinytext NOT NULL,
  `bio` text,
  `avatarid` int(11) DEFAULT NULL,
  `lastseen` int(11) DEFAULT NULL,
  `following` text,
  `blacklist` text,
  `rank` tinyint(4) DEFAULT NULL,
  `networks` tinytext,
  `authkey` tinytext,
  `emailverified` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`(30))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `users` (`id`, `username`, `email`, `password`, `displayname`, `bio`, `avatarid`, `lastseen`, `following`, `blacklist`, `rank`, `networks`, `authkey`, `emailverified`) VALUES
(4,	'jaxbot',	'jaxbot@gmail.com',	'$2a$11$PlUACuZyK7Oi/QNgT6wSPOC3B4Hv2Vwc29hnlyW5DM.h/xzexI6k.',	'Jonathan',	'Jonathan test account',	1390708388,	1378173008,	'55,57',	'',	50,	'0',	'4dab1a8afdfca30ed4492016f9db397df38353652',	NULL),
(6,	'ivey',	'iveysaurrr@gmail.com',	'$2a$11$PlUACuZyK7Oi/QNgT6wSPOC3B4Hv2Vwc29hnlyW5DM.h/xzexI6k.',	'ivey',	'Ivey test account',	1389580622,	1377919665,	'4',	'',	0,	'0',	'$2a$11$eetQaY5qp3Z/9bW8aGofWuXMjHe4pgmKUJkgIPHzapBUNTwDfnVn2',	NULL);

-- 2014-01-28 21:20:46
