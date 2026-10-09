ALTER TABLE `expenses` ADD `recurrenceKey` varchar(140);--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_recurrenceKey_unique` UNIQUE(`recurrenceKey`);