CREATE TABLE `shoe_gallery_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`image_url` text NOT NULL,
	`created_at` text NOT NULL
);
