ALTER TABLE `expenses` ADD `dueDate` varchar(10);--> statement-breakpoint
ALTER TABLE `expenses` ADD `recurrence` enum('none','monthly') DEFAULT 'none' NOT NULL;