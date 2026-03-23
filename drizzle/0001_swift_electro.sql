CREATE TABLE `client_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`username` varchar(128) NOT NULL,
	`passwordHash` varchar(256) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastLogin` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_credentials_clientProfileId_unique` UNIQUE(`clientProfileId`),
	CONSTRAINT `client_credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `client_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`address` text,
	`city` varchar(128),
	`state` varchar(64),
	`zipCode` varchar(16),
	`businessName` varchar(256),
	`businessType` varchar(128),
	`businessStartDate` varchar(32),
	`timeInBusiness` varchar(64),
	`totalBusinessIncome` decimal(15,2),
	`personalIncome` decimal(15,2),
	`fundingNeeded` decimal(15,2),
	`ficoScore` int,
	`monthlyRevenue` decimal(15,2),
	`existingDebt` decimal(15,2),
	`fundingPurpose` text,
	`fundingStatus` enum('pending','under_review','approved','funded','declined','on_hold') NOT NULL DEFAULT 'pending',
	`fundingAmount` decimal(15,2),
	`approvedDate` timestamp,
	`fundedDate` timestamp,
	`notes` text,
	`internalNotes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`sessionToken` varchar(256) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
