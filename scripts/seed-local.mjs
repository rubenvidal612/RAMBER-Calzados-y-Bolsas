import { DatabaseSync } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)); // scripts/
const project = join(root, "..");

// 1) Localizar el archivo SQLite de la D1 local (Miniflare)
const d1dir = join(project, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
const files = readdirSync(d1dir).filter((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
if (!files.length) throw new Error("No se encontró el SQLite de la D1 local en " + d1dir);
const dbFile = join(d1dir, files[0]);
console.log("DB:", dbFile);

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON");

// 2) Esquema final (equivalente al estado posterior a todas las migraciones)
const schema = [
  `CREATE TABLE IF NOT EXISTS site_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL, updated_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS news_items (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, title text NOT NULL, body text DEFAULT '' NOT NULL, image_url text DEFAULT '' NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS shoe_gallery_items (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, category text NOT NULL, title text NOT NULL, caption text DEFAULT '' NOT NULL, image_url text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS shoe_products (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    category text NOT NULL,
    model text NOT NULL,
    sku text,
    name text NOT NULL,
    description text DEFAULT '' NOT NULL,
    color text NOT NULL,
    cost_price integer DEFAULT 0 NOT NULL,
    public_price integer NOT NULL,
    promo_price integer,
    in_offer integer DEFAULT 0 NOT NULL,
    discount_type text,
    discount_value integer,
    is_active integer DEFAULT 1 NOT NULL,
    primary_image_url text NOT NULL,
    primary_image_zoom integer DEFAULT 100 NOT NULL,
    primary_image_x integer DEFAULT 50 NOT NULL,
    primary_image_y integer DEFAULT 50 NOT NULL,
    created_by text,
    updated_by text,
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS shoe_products_category_model_unique ON shoe_products (category, model)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS shoe_products_sku_unique ON shoe_products (sku)`,
  `CREATE TABLE IF NOT EXISTS shoe_product_sizes (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    product_id integer NOT NULL REFERENCES shoe_products(id) ON DELETE cascade,
    size text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS shoe_product_sizes_product_size_unique ON shoe_product_sizes (product_id, size)`,
  `CREATE TABLE IF NOT EXISTS shoe_product_images (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    product_id integer NOT NULL REFERENCES shoe_products(id) ON DELETE cascade,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS branches (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    short_name text NOT NULL,
    address text DEFAULT '' NOT NULL,
    phone text DEFAULT '' NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS shoe_product_variants (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    product_id integer NOT NULL REFERENCES shoe_products(id) ON DELETE cascade,
    color text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS shoe_product_variants_product_color_unique ON shoe_product_variants (product_id, color)`,
  `CREATE TABLE IF NOT EXISTS branch_stock (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    variant_id integer NOT NULL REFERENCES shoe_product_variants(id) ON DELETE cascade,
    size text NOT NULL,
    branch_id text NOT NULL REFERENCES branches(id),
    quantity integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 2 NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS branch_stock_variant_size_branch_unique ON branch_stock (variant_id, size, branch_id)`,
  `CREATE INDEX IF NOT EXISTS idx_branch_stock_branch_variant ON branch_stock (branch_id, variant_id)`,
  `CREATE TABLE IF NOT EXISTS inventory_transfers (
    id text PRIMARY KEY NOT NULL,
    origin_branch_id text NOT NULL REFERENCES branches(id),
    destination_branch_id text NOT NULL REFERENCES branches(id),
    created_at text NOT NULL,
    user_id text,
    note text DEFAULT '' NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id text PRIMARY KEY NOT NULL,
    product_id integer NOT NULL REFERENCES shoe_products(id) ON DELETE cascade,
    variant_id integer NOT NULL REFERENCES shoe_product_variants(id) ON DELETE cascade,
    size text NOT NULL,
    branch_id text NOT NULL REFERENCES branches(id),
    type text NOT NULL,
    quantity_delta integer NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reason text DEFAULT '' NOT NULL,
    reference_id text,
    user_id text,
    created_at text NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_branch_created_at ON inventory_movements (branch_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_variant ON inventory_movements (product_id, variant_id)`,
  `CREATE TABLE IF NOT EXISTS roles (
    id text PRIMARY KEY NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text DEFAULT '' NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS roles_code_unique ON roles (code)`,
  `CREATE TABLE IF NOT EXISTS permissions (
    code text PRIMARY KEY NOT NULL,
    label text NOT NULL,
    "group" text NOT NULL,
    created_at text NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS role_permissions (
    role_id text NOT NULL REFERENCES roles(id) ON DELETE cascade,
    permission_code text NOT NULL REFERENCES permissions(code) ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_unique ON role_permissions (role_id, permission_code)`,
  `CREATE TABLE IF NOT EXISTS employees (
    id text PRIMARY KEY NOT NULL,
    login_name text NOT NULL,
    first_name text NOT NULL,
    last_name text DEFAULT '' NOT NULL,
    phone text DEFAULT '' NOT NULL,
    email text DEFAULT '' NOT NULL,
    pin_hash text NOT NULL,
    pin_salt text NOT NULL,
    role_id text NOT NULL REFERENCES roles(id),
    position text DEFAULT '' NOT NULL,
    branch_id text REFERENCES branches(id),
    joined_at text NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    photo_url text DEFAULT '' NOT NULL,
    pay_type text DEFAULT '' NOT NULL,
    pay_rate integer,
    internal_notes text DEFAULT '' NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS employees_login_name_unique ON employees (login_name)`,
  `CREATE TABLE IF NOT EXISTS employee_permissions (
    employee_id text NOT NULL REFERENCES employees(id) ON DELETE cascade,
    permission_code text NOT NULL REFERENCES permissions(code) ON DELETE cascade,
    allowed integer NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS employee_permissions_unique ON employee_permissions (employee_id, permission_code)`,
];
for (const stmt of schema) db.exec(stmt);
console.log("Esquema creado:", schema.length, "instrucciones");

// 3) Sembrar roles/permissions/role_permissions desde la migración 0006 (solo INSERTs)
const m0006 = readFileSync(join(project, "drizzle", "0006_great_pepper_potts.sql"), "utf8");
for (const stmt of m0006.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
  if (stmt.startsWith("INSERT")) db.exec(stmt);
}
console.log("Roles y permisos sembrados");

// 4) Sembrar sucursales + producto + variante + stock + fotos
const now = new Date().toISOString();
const ins = (sql) => db.prepare(sql);

ins(`INSERT OR IGNORE INTO branches (id, name, short_name, address, phone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  .run("crystal", "Plaza Crystal", "Crystal", "", "", 1, now);
ins(`INSERT OR IGNORE INTO branches (id, name, short_name, address, phone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  .run("americas", "Plaza Las Américas", "Las Américas", "", "", 1, now);

ins(`INSERT OR IGNORE INTO shoe_products (category, model, sku, name, description, color, cost_price, public_price, promo_price, in_offer, discount_type, discount_value, is_active, primary_image_url, primary_image_zoom, primary_image_x, primary_image_y, created_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run("infantil", "4025", null, "4025", "", "blanco", 0, 500, null, 0, null, null, 1, "/images/calzado/modelo-4025.jpg", 100, 50, 50, null, null, now, now);

const productId = Number(db.prepare(`SELECT id FROM shoe_products WHERE model = '4025' ORDER BY id DESC LIMIT 1`).get().id);

ins(`INSERT OR IGNORE INTO shoe_product_variants (product_id, color, created_at, updated_at) VALUES (?, ?, ?, ?)`)
  .run(productId, "blanco", now, now);
const variantId = Number(db.prepare(`SELECT id FROM shoe_product_variants WHERE product_id = ? LIMIT 1`).get(productId).id);

const sizes = ["14", "14.5", "15", "15.5", "16", "16.5", "17", "17.5"];
for (const size of sizes) {
  ins(`INSERT OR IGNORE INTO branch_stock (variant_id, size, branch_id, quantity, low_stock_threshold, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(variantId, size, "crystal", 1, 2, now);
  ins(`INSERT OR IGNORE INTO shoe_product_sizes (product_id, size, quantity) VALUES (?, ?, ?)`)
    .run(productId, size, 1);
}
ins(`INSERT OR IGNORE INTO shoe_product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)`)
  .run(productId, "/images/calzado/modelo-4025.jpg", 0);

console.log("Producto sembrado: id", productId, "variante", variantId);

// 5) Verificación
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all().map((r) => r.name);
const count = db.prepare(`SELECT COUNT(*) AS c FROM shoe_products`).get().c;
console.log("Tablas (" + tables.length + "):", tables.join(", "));
console.log("Productos en shoe_products:", count);
db.close();
