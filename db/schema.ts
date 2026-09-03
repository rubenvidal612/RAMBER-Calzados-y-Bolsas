import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
