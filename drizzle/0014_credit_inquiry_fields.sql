ALTER TABLE `credit_report_inquiries`
  ADD COLUMN `cityStateZip` varchar(256),
  ADD COLUMN `scheduledToRemainUntil` varchar(64);
