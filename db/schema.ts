import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const newsItems = sqliteTable("news_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const shoeGalleryItems = sqliteTable("shoe_gallery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  caption: text("caption").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  createdAt: text("created_at").notNull(),
});

// Catálogo inicial de calzado. El inventario se añadirá después sobre la
// variante (producto + color + talla), nunca como stock global del producto.
export const shoeProducts = sqliteTable("shoe_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(),
  model: text("model").notNull(),
  sku: text("sku"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull(),
  costPrice: integer("cost_price").notNull().default(0),
  publicPrice: integer("public_price").notNull(),
  promoPrice: integer("promo_price"),
  inOffer: integer("in_offer", { mode: "boolean" }).notNull().default(false),
  discountType: text("discount_type"),
  discountValue: integer("discount_value"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  primaryImageUrl: text("primary_image_url").notNull(),
  primaryImageZoom: integer("primary_image_zoom").notNull().default(100),
  primaryImageX: integer("primary_image_x").notNull().default(50),
  primaryImageY: integer("primary_image_y").notNull().default(50),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("shoe_products_category_model_unique").on(table.category, table.model),
  uniqueIndex("shoe_products_sku_unique").on(table.sku),
]);

export const shoeProductSizes = sqliteTable("shoe_product_sizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => shoeProducts.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull().default(0),
}, (table) => [uniqueIndex("shoe_product_sizes_product_size_unique").on(table.productId, table.size)]);

export const shoeProductImages = sqliteTable("shoe_product_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => shoeProducts.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Inventario RAMBER: una existencia siempre corresponde a variante/color + talla + sucursal.
export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const shoeProductVariants = sqliteTable("shoe_product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => shoeProducts.id, { onDelete: "cascade" }),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("shoe_product_variants_product_color_unique").on(table.productId, table.color)]);

export const branchStock = sqliteTable("branch_stock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  variantId: integer("variant_id").notNull().references(() => shoeProductVariants.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  branchId: text("branch_id").notNull().references(() => branches.id),
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("branch_stock_variant_size_branch_unique").on(table.variantId, table.size, table.branchId),
  index("idx_branch_stock_branch_variant").on(table.branchId, table.variantId),
]);

export const inventoryTransfers = sqliteTable("inventory_transfers", {
  id: text("id").primaryKey(),
  originBranchId: text("origin_branch_id").notNull().references(() => branches.id),
  destinationBranchId: text("destination_branch_id").notNull().references(() => branches.id),
  createdAt: text("created_at").notNull(),
  userId: text("user_id"),
  note: text("note").notNull().default(""),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => shoeProducts.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").notNull().references(() => shoeProductVariants.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  branchId: text("branch_id").notNull().references(() => branches.id),
  type: text("type").notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason").notNull().default(""),
  referenceId: text("reference_id"),
  userId: text("user_id"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_inventory_movements_created_at").on(table.createdAt),
  index("idx_inventory_movements_branch_created_at").on(table.branchId, table.createdAt),
  index("idx_inventory_movements_product_variant").on(table.productId, table.variantId),
]);

// Oficina Virtual: identidad, permisos explícitos y relación operativa con sucursales.
// Los PIN se persisten como hash + salt PBKDF2, nunca en texto plano.
export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("roles_code_unique").on(table.code)]);

export const permissions = sqliteTable("permissions", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  group: text("group").notNull(),
  createdAt: text("created_at").notNull(),
});

export const rolePermissions = sqliteTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionCode: text("permission_code").notNull().references(() => permissions.code, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("role_permissions_unique").on(table.roleId, table.permissionCode)]);

export const employees = sqliteTable("employees", {
  id: text("id").primaryKey(),
  loginName: text("login_name").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  pinHash: text("pin_hash").notNull(),
  pinSalt: text("pin_salt").notNull(),
  roleId: text("role_id").notNull().references(() => roles.id),
  position: text("position").notNull().default(""),
  branchId: text("branch_id").references(() => branches.id),
  joinedAt: text("joined_at").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  photoUrl: text("photo_url").notNull().default(""),
  payType: text("pay_type").notNull().default(""),
  payRate: integer("pay_rate"),
  internalNotes: text("internal_notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("employees_login_name_unique").on(table.loginName)]);

export const employeePermissions = sqliteTable("employee_permissions", {
  employeeId: text("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  permissionCode: text("permission_code").notNull().references(() => permissions.code, { onDelete: "cascade" }),
  allowed: integer("allowed", { mode: "boolean" }).notNull(),
}, (table) => [uniqueIndex("employee_permissions_unique").on(table.employeeId, table.permissionCode)]);
