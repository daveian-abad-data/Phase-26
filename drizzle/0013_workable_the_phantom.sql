CREATE TABLE `billing_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`billingStatus` enum('pending','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`dateIssued` varchar(32),
	`amountIssued` decimal(15,2),
	`amountPaid` decimal(15,2),
	`datePaid` varchar(32),
	`billingLink` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`taskTitle` varchar(256) NOT NULL,
	`urgency` enum('High','Fair','Low') NOT NULL DEFAULT 'Fair',
	`taskDetails` text,
	`dateAssigned` varchar(32),
	`dueDate` varchar(32),
	`status` enum('Ongoing','Complete','Failed') NOT NULL DEFAULT 'Ongoing',
	`resultNotes` text,
	`completionRate` enum('0%','10%','20%','30%','40%','50%','60%','70%','80%','90%','100%') NOT NULL DEFAULT '0%',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientProfileId` int NOT NULL,
	`taskTitle` varchar(256) NOT NULL,
	`taskDetails` text,
	`urgency` enum('High','Fair','Low') NOT NULL DEFAULT 'Fair',
	`assignedBy` varchar(256),
	`assignedTo` varchar(256),
	`dateAssigned` varchar(32),
	`dueDate` varchar(32),
	`status` enum('Ongoing','Complete','Failed') NOT NULL DEFAULT 'Ongoing',
	`resultNotes` text,
	`completionRate` enum('0%','10%','20%','30%','40%','50%','60%','70%','80%','90%','100%') NOT NULL DEFAULT '0%',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_tasks_id` PRIMARY KEY(`id`)
);
