ALTER TABLE `client_profiles` DROP INDEX `client_profiles_clientId_unique`;--> statement-breakpoint
ALTER TABLE `client_profiles` DROP COLUMN `clientId`;--> statement-breakpoint
ALTER TABLE `credit_accounts` DROP COLUMN `clientId`;