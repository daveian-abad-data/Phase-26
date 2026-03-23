CREATE TABLE `credit_report_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditReportId` int NOT NULL,
	`clientProfileId` int NOT NULL,
	`accountName` varchar(256),
	`inquiredOn` varchar(32),
	`businessType` varchar(256),
	`address` text,
	`contactNumber` varchar(64),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_report_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `selfReportedBalance` decimal(15,2);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `creditUsagePercentNoAU` varchar(16);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `creditUsedNoAU` decimal(15,2);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `creditLimitNoAU` decimal(15,2);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `selfReportedAccounts` int;--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `evaluation` enum('Poor','Fair','Good','Very Good','Exceptional');--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `reportPersonName` varchar(256);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `reportAlsoKnownAs` text;--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `reportYearOfBirth` varchar(16);--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `reportAddresses` text;--> statement-breakpoint
ALTER TABLE `credit_reports` ADD `reportEmployers` text;