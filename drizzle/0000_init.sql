CREATE TABLE `match` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`played_at` integer DEFAULT (unixepoch()) NOT NULL,
	`home_player_id` integer NOT NULL,
	`away_player_id` integer NOT NULL,
	`home_team_id` integer NOT NULL,
	`away_team_id` integer NOT NULL,
	`home_goals` integer NOT NULL,
	`away_goals` integer NOT NULL,
	`home_pens` integer,
	`away_pens` integer,
	`home_rating` integer NOT NULL,
	`away_rating` integer NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`home_player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`home_team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "players_differ" CHECK("match"."home_player_id" <> "match"."away_player_id"),
	CONSTRAINT "goals_non_negative" CHECK("match"."home_goals" >= 0 AND "match"."away_goals" >= 0),
	CONSTRAINT "pens_consistent" CHECK(("match"."home_pens" IS NULL AND "match"."away_pens" IS NULL)
				OR ("match"."home_pens" IS NOT NULL AND "match"."away_pens" IS NOT NULL
					AND "match"."home_goals" = "match"."away_goals"
					AND "match"."home_pens" >= 0 AND "match"."away_pens" >= 0
					AND "match"."home_pens" <> "match"."away_pens"))
);
--> statement-breakpoint
CREATE INDEX `match_played_at_idx` ON `match` (`played_at`);--> statement-breakpoint
CREATE INDEX `match_home_player_idx` ON `match` (`home_player_id`);--> statement-breakpoint
CREATE INDEX `match_away_player_idx` ON `match` (`away_player_id`);--> statement-breakpoint
CREATE TABLE `player` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_name_uq` ON `player` (lower("name"));--> statement-breakpoint
CREATE TABLE `team` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer NOT NULL,
	`name` text NOT NULL,
	`league` text NOT NULL,
	`overall` integer NOT NULL,
	`attack` integer NOT NULL,
	`midfield` integer NOT NULL,
	`defence` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_source_uq` ON `team` (`source_id`);--> statement-breakpoint
CREATE INDEX `team_overall_idx` ON `team` (`overall`);