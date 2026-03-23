CREATE TABLE `team_member_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamMemberId` int NOT NULL,
	`sessionToken` varchar(256) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_member_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_member_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
