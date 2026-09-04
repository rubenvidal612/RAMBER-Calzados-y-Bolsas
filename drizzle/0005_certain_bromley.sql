CREATE TABLE `branch_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`variant_id` integer NOT NULL,
	`size` text NOT NULL,
	`branch_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`low_stock_threshold` integer DEFAULT 2 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `shoe_product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `branch_stock_variant_size_branch_unique` ON `branch_stock` (`variant_id`,`size`,`branch_id`);--> statement-breakpoint
CREATE INDEX `idx_branch_stock_branch_variant` ON `branch_stock` (`branch_id`,`variant_id`);--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	`variant_id` integer NOT NULL,
	`size` text NOT NULL,
	`branch_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity_delta` integer NOT NULL,
	`quantity_before` integer NOT NULL,
	`quantity_after` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`reference_id` text,
	`user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `shoe_products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `shoe_product_variants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_created_at` ON `inventory_movements` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_branch_created_at` ON `inventory_movements` (`branch_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_inventory_movements_product_variant` ON `inventory_movements` (`product_id`,`variant_id`);--> statement-breakpoint
CREATE TABLE `inventory_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`origin_branch_id` text NOT NULL,
	`destination_branch_id` text NOT NULL,
	`created_at` text NOT NULL,
	`user_id` text,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`origin_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shoe_product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `shoe_products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shoe_product_variants_product_color_unique` ON `shoe_product_variants` (`product_id`,`color`);
--> statement-breakpoint
INSERT INTO `branches` (`id`,`name`,`short_name`,`address`,`phone`,`is_active`,`created_at`) VALUES
  ('crystal','RAMBER Plaza Crystal','Crystal','','',true,'2026-09-04T00:00:00.000Z'),
  ('americas','RAMBER Plaza Las Américas','Américas','','',true,'2026-09-04T00:00:00.000Z');
--> statement-breakpoint
INSERT INTO `shoe_product_variants` (`product_id`,`color`,`created_at`,`updated_at`)
SELECT `id`,`color`,`created_at`,`updated_at` FROM `shoe_products`;
--> statement-breakpoint
INSERT INTO `branch_stock` (`variant_id`,`size`,`branch_id`,`quantity`,`low_stock_threshold`,`updated_at`)
SELECT v.`id`, s.`size`, 'crystal', s.`quantity`, 2, p.`updated_at`
FROM `shoe_product_sizes` s
JOIN `shoe_product_variants` v ON v.`product_id` = s.`product_id`
JOIN `shoe_products` p ON p.`id` = s.`product_id`;
--> statement-breakpoint
INSERT INTO `inventory_movements` (`id`,`product_id`,`variant_id`,`size`,`branch_id`,`type`,`quantity_delta`,`quantity_before`,`quantity_after`,`reason`,`created_at`)
SELECT lower(hex(randomblob(16))), v.`product_id`, v.`id`, s.`size`, 'crystal', 'OPENING_STOCK', s.`quantity`, 0, s.`quantity`, 'Migración de existencias iniciales', p.`updated_at`
FROM `shoe_product_sizes` s
JOIN `shoe_product_variants` v ON v.`product_id` = s.`product_id`
JOIN `shoe_products` p ON p.`id` = s.`product_id`
WHERE s.`quantity` > 0;
