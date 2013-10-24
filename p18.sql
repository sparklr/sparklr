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
  `tags` text,
  `time` int(11) NOT NULL,
  `public` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `origid` int(11) DEFAULT NULL,
  `via` int(11) DEFAULT NULL,
  `commentcount` int(11) DEFAULT NULL,
  `modified` int(11) DEFAULT NULL,
  `blockcount` tinyint(4) DEFAULT '0',
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
  `followers` text,
  `following` text,
  `blacklist` text,
  `whitelist` text,
  `private` tinyint(4) DEFAULT NULL,
  `emailverified` tinyint(4) DEFAULT NULL,
  `rank` tinyint(4) DEFAULT NULL,
  `networks` tinytext,
  `background` int(11) DEFAULT NULL,
  `authkey` tinytext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`(30))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `users` (`id`, `username`, `email`, `password`, `displayname`, `bio`, `avatarid`, `lastseen`, `followers`, `following`, `blacklist`, `whitelist`, `private`, `emailverified`, `rank`, `networks`, `background`, `authkey`) VALUES
(4,	'jaxbot',	'jaxbot@societyofcode.com',	'$2a$11$PlUACuZyK7Oi/QNgT6wSPOC3B4Hv2Vwc29hnlyW5DM.h/xzexI6k.',	'Jonathan warner 2âœ»',	'hi im jonathan hehe defsfsd fdsfdfdssdf',	1380993255,	1378173008,	'8,5,1,1,40,41,42,43,44,45,46,48,49,51,52,6',	'1,5,43,4,44,45,46,48,51,52,6,55',	'',	NULL,	0,	0,	50,	'0',	1380993260,	'4dab1a8afdfca30ed4492016f9db397df38353652'),
(6,	'ivey',	'iveysaurrr@gmail.com',	'$2a$11$PlUACuZyK7Oi/QNgT6wSPOC3B4Hv2Vwc29hnlyW5DM.h/xzexI6k.',	'ivey',	'I love you~ what~~~',	1381233913,	1377919665,	'1,48,4',	'',	'',	NULL,	0,	0,	0,	'0',	1378927645,	'$2a$11$eetQaY5qp3Z/9bW8aGofWuXMjHe4pgmKUJkgIPHzapBUNTwDfnVn2'),
(55,	'ivan',	'jaxbot@gmail.com22',	'$2a$11$8VfrP0JhgZdK1.9NAhAvQ.JrfM6LkYo9l/9dpsURfg7.W5hDdBgd2',	'Ivan Colburnâœ»',	' I\'m a Sparklr Test account, 18, big music fan. Krew for lyfe lol!',	1381000465,	1378334947,	'54',	'54,4,6',	'',	NULL,	0,	NULL,	50,	'0,odd',	1381723244,	'test12b5c4139841d4671c291ddd98162f8736a59577a8');

-- 2013-10-24 12:16:16
