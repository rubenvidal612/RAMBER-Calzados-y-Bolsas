import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
