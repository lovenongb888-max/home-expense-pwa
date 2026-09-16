CREATE TABLE `appDownloadEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appVersion` varchar(32) NOT NULL,
	`platform` varchar(32) NOT NULL DEFAULT 'web',
	`downloadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appDownloadEvents_id` PRIMARY KEY(`id`)
);
