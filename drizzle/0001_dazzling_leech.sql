CREATE TABLE `recurring_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`client_id` integer NOT NULL,
	`assignee_id` integer NOT NULL,
	`created_by_id` integer,
	`priority` text DEFAULT 'MEDIUM' NOT NULL,
	`days_of_week` text DEFAULT 'MON,TUE,WED,THU,FRI,SAT,SUN' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurring_task_id` integer REFERENCES recurring_tasks(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `reply_token` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `replied_at` text;