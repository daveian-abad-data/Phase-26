CREATE TABLE `call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`callTitle` varchar(256) NOT NULL,
	`callDate` varchar(32),
	`callTime` varchar(32),
	`host` varchar(256),
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`recordingLink` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditReportId` int NOT NULL,
	`clientProfileId` int NOT NULL,
	`accountName` varchar(256),
	`openClosed` varchar(16),
	`responsibility` varchar(64),
	`accountNumber` varchar(64),
	`dateOpened` varchar(32),
	`statusUpdated` varchar(32),
	`accountType` varchar(128),
	`status` varchar(128),
	`balance` decimal(15,2),
	`creditLimit` decimal(15,2),
	`creditUsage` varchar(16),
	`monthlyPayment` decimal(15,2),
	`lastPaymentDate` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`bureau` varchar(64),
	`reportDate` varchar(32),
	`ficoScore` int,
	`ficoScoreModel` varchar(64),
	`openAccounts` int,
	`closedAccounts` int,
	`collectionsCount` int,
	`averageAccountAge` varchar(64),
	`oldestAccount` varchar(64),
	`creditUsagePercent` varchar(16),
	`creditUsed` decimal(15,2),
	`creditLimit` decimal(15,2),
	`creditCardDebt` decimal(15,2),
	`loanDebt` decimal(15,2),
	`collectionsDebt` decimal(15,2),
	`totalDebt` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funding_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`callDate` varchar(32),
	`round` varchar(16),
	`product` varchar(256),
	`type` varchar(64),
	`rates` varchar(128),
	`appliedLimit` decimal(15,2),
	`status` enum('approved','denied','conditionally_approved','pending') NOT NULL DEFAULT 'pending',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funding_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`category` enum('document','bank_relationship') NOT NULL,
	`label` varchar(256) NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`fileUrl` text,
	`fileName` varchar(256),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `underwriting` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`underwriterPersonnel` varchar(256),
	`underwritingCallDate` varchar(32),
	`sourceType` varchar(128),
	`contractType` varchar(128),
	`dateContractSent` varchar(32),
	`dateContractSigned` varchar(32),
	`fundingAmountNeededMin` decimal(15,2),
	`fundingAmountNeededMax` decimal(15,2),
	`fundingProjectionMin` decimal(15,2),
	`fundingProjectionMax` decimal(15,2),
	`urgency` varchar(128),
	`expectedTimeFrame` varchar(128),
	`annualBusinessIncome` decimal(15,2),
	`annualPersonalIncome` decimal(15,2),
	`cashOnHand` decimal(15,2),
	`initialTierType` varchar(64),
	`initialFicoScore` int,
	`initialCreditUtilization` varchar(32),
	`totalCreditLimit` decimal(15,2),
	`creditDebt` decimal(15,2),
	`totalOpenAccounts` int,
	`totalInquiries` int,
	`averageAccountAge` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `underwriting_id` PRIMARY KEY(`id`),
	CONSTRAINT `underwriting_clientProfileId_unique` UNIQUE(`clientProfileId`)
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`originalName` varchar(256) NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`mimeType` varchar(128),
	`fileSize` int,
	`category` varchar(128),
	`uploadedBy` varchar(256),
	`uploadedByRole` enum('admin','client') NOT NULL DEFAULT 'admin',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploaded_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `photoUrl` text;--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `tierType` varchar(64);--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `invoiceAmountIssued` decimal(15,2);--> statement-breakpoint
ALTER TABLE `client_profiles` ADD `invoiceAmountPaid` decimal(15,2);