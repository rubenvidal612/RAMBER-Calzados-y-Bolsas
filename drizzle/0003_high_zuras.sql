ALTER TABLE `shoe_product_sizes` ADD `quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shoe_products` ADD `cost_price` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `shoe_products` ADD `discount_type` text;--> statement-breakpoint
ALTER TABLE `shoe_products` ADD `discount_value` integer;