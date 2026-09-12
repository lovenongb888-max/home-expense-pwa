CREATE TABLE `expenseCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`icon` varchar(32) NOT NULL DEFAULT 'circle',
	`color` varchar(24) NOT NULL DEFAULT '#3B7D78',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenseCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`title` varchar(160) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`spentAt` timestamp NOT NULL,
	`note` text,
	`receiptKey` text,
	`receiptUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
