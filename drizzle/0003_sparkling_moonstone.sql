ALTER TABLE `expenseCategories` ADD `ownerKey` varchar(64) DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` ADD `ownerKey` varchar(64) DEFAULT 'legacy' NOT NULL;