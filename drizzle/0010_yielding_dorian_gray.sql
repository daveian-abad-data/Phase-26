ALTER TABLE `credit_accounts` RENAME COLUMN `creditUnion` TO `bureau`;--> statement-breakpoint
ALTER TABLE `credit_accounts` MODIFY COLUMN `creditAccountCategory` enum('Cards','Car','House','Secured Loan','Unsecured Loan','Others');--> statement-breakpoint
ALTER TABLE `credit_accounts` ADD `creditReportId` int;