ALTER TABLE `credit_accounts` MODIFY COLUMN `creditUsage` varchar(32);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `clientId` varchar(64);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `creditUnion` varchar(64);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `reportDate` varchar(32);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `balanceUpdated` varchar(32);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `originalBalance` decimal(15,2);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `paidOff` varchar(32);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `terms` varchar(128);--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `dispute` text;--> statement-breakpoint
ALTER TABLE `credit_accounts` DROP COLUMN `creditReportId`;