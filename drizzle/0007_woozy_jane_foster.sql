CREATE TABLE `appVersionSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(64) NOT NULL,
	`appVersion` varchar(32) NOT NULL,
	`platform` varchar(32) NOT NULL DEFAULT 'web',
	`lastSeen` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appVersionSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `appVersionSessions_clientId_unique` UNIQUE(`clientId`)
);
