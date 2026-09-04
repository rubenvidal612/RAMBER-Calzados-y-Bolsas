CREATE TABLE `employee_permissions` (
	`employee_id` text NOT NULL,
	`permission_code` text NOT NULL,
	`allowed` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_code`) REFERENCES `permissions`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_permissions_unique` ON `employee_permissions` (`employee_id`,`permission_code`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`login_name` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`pin_hash` text NOT NULL,
	`pin_salt` text NOT NULL,
	`role_id` text NOT NULL,
	`position` text DEFAULT '' NOT NULL,
	`branch_id` text,
	`joined_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`photo_url` text DEFAULT '' NOT NULL,
	`pay_type` text DEFAULT '' NOT NULL,
	`pay_rate` integer,
	`internal_notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_login_name_unique` ON `employees` (`login_name`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`code` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`group` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_code` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_code`) REFERENCES `permissions`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_unique` ON `role_permissions` (`role_id`,`permission_code`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_code_unique` ON `roles` (`code`);--> statement-breakpoint
ALTER TABLE `shoe_products` ADD `created_by` text;--> statement-breakpoint
ALTER TABLE `shoe_products` ADD `updated_by` text;
--> statement-breakpoint
INSERT OR IGNORE INTO `roles` (`id`,`code`,`name`,`description`,`created_at`) VALUES
 ('owner','OWNER','Dueño','Acceso total a RAMBER','2026-09-04T00:00:00.000Z'),
 ('admin','ADMIN','Administrador','Administración amplia y configurable','2026-09-04T00:00:00.000Z'),
 ('manager','MANAGER','Encargado','Operación de una sucursal','2026-09-04T00:00:00.000Z'),
 ('seller','SELLER','Cajero','Consulta y operación de caja futura','2026-09-04T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO `permissions` (`code`,`label`,`group`,`created_at`) VALUES
 ('VIEW_PRODUCTS','Ver productos','Productos','2026-09-04T00:00:00.000Z'),('CREATE_PRODUCTS','Crear productos','Productos','2026-09-04T00:00:00.000Z'),('EDIT_PRODUCTS','Editar productos','Productos','2026-09-04T00:00:00.000Z'),('VIEW_COST','Ver costos','Productos','2026-09-04T00:00:00.000Z'),('EDIT_PRICES','Editar precios','Productos','2026-09-04T00:00:00.000Z'),('APPLY_DISCOUNT','Aplicar descuentos','Productos','2026-09-04T00:00:00.000Z'),
 ('VIEW_INVENTORY','Ver inventario','Inventario','2026-09-04T00:00:00.000Z'),('ADJUST_INVENTORY','Ajustar inventario','Inventario','2026-09-04T00:00:00.000Z'),('RECEIVE_STOCK','Recibir mercancía','Inventario','2026-09-04T00:00:00.000Z'),('TRANSFER_STOCK','Transferir mercancía','Inventario','2026-09-04T00:00:00.000Z'),('VIEW_MOVEMENTS','Ver movimientos','Inventario','2026-09-04T00:00:00.000Z'),('SEARCH_AVAILABILITY','Buscar existencia','Inventario','2026-09-04T00:00:00.000Z'),
 ('VIEW_ALL_BRANCHES','Ver todas las sucursales','Sucursales','2026-09-04T00:00:00.000Z'),('CHANGE_BRANCH','Cambiar sucursal','Sucursales','2026-09-04T00:00:00.000Z'),('MANAGE_BRANCHES','Administrar sucursales','Sucursales','2026-09-04T00:00:00.000Z'),
 ('VIEW_REPORTS','Ver reportes','Administración','2026-09-04T00:00:00.000Z'),('MANAGE_EMPLOYEES','Administrar empleados','Administración','2026-09-04T00:00:00.000Z'),('MANAGE_ROLES','Administrar roles y permisos','Administración','2026-09-04T00:00:00.000Z'),('OPEN_SETTINGS','Entrar a ajustes','Administración','2026-09-04T00:00:00.000Z'),
 ('SELL','Vender','Próximamente','2026-09-04T00:00:00.000Z'),('QUICK_SALE','Venta rápida','Próximamente','2026-09-04T00:00:00.000Z'),('CANCEL_SALE','Cancelar venta','Próximamente','2026-09-04T00:00:00.000Z'),('CONFIGURE_PRINTER','Configurar impresoras','Próximamente','2026-09-04T00:00:00.000Z'),('CLOCK_IN_OUT','Usar reloj checador','Próximamente','2026-09-04T00:00:00.000Z');
--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`,`permission_code`) SELECT 'owner', `code` FROM `permissions`;
--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`,`permission_code`) SELECT 'admin', `code` FROM `permissions` WHERE `code` NOT IN ('CLOCK_IN_OUT');
--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`,`permission_code`) VALUES
 ('manager','VIEW_PRODUCTS'),('manager','VIEW_INVENTORY'),('manager','SEARCH_AVAILABILITY'),('manager','RECEIVE_STOCK'),('manager','VIEW_MOVEMENTS'),('manager','TRANSFER_STOCK');
--> statement-breakpoint
INSERT OR IGNORE INTO `role_permissions` (`role_id`,`permission_code`) VALUES
 ('seller','VIEW_PRODUCTS'),('seller','VIEW_INVENTORY'),('seller','SEARCH_AVAILABILITY'),('seller','SELL');
