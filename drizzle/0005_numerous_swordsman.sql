CREATE TABLE `expenseHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ownerKey` varchar(64) NOT NULL DEFAULT 'legacy',
	`expenseId` int NOT NULL,
	`action` enum('updated','deleted') NOT NULL,
	`snapshot` text NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenseHistory_id` PRIMARY KEY(`id`)
);
