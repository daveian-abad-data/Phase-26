ALTER TABLE `client_profiles` ADD `clientId` varchar(64);--> statement-breakpoint
ALTER TABLE `client_profiles` ADD CONSTRAINT `client_profiles_clientId_unique` UNIQUE(`clientId`);