import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`vendure_collection\` (
  	\`id\` numeric PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`vendure_collection_updated_at_idx\` ON \`vendure_collection\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`vendure_collection_created_at_idx\` ON \`vendure_collection\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`vendure_collection_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` numeric NOT NULL,
  	\`path\` text NOT NULL,
  	\`vendure_product_variant_id\` numeric,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`vendure_collection\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vendure_product_variant_id\`) REFERENCES \`vendure_product_variant\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`vendure_collection_rels_order_idx\` ON \`vendure_collection_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`vendure_collection_rels_parent_idx\` ON \`vendure_collection_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`vendure_collection_rels_path_idx\` ON \`vendure_collection_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`vendure_collection_rels_vendure_product_variant_id_idx\` ON \`vendure_collection_rels\` (\`vendure_product_variant_id\`);`)
  await db.run(sql`ALTER TABLE \`vendure_product_rels\` ADD \`vendure_collection_id\` numeric REFERENCES vendure_collection(id);`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_vendure_collection_id_idx\` ON \`vendure_product_rels\` (\`vendure_collection_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`vendure_collection_id\` numeric REFERENCES vendure_collection(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vendure_collection_id_idx\` ON \`payload_locked_documents_rels\` (\`vendure_collection_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`vendure_collection\`;`)
  await db.run(sql`DROP TABLE \`vendure_collection_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_vendure_product_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` numeric NOT NULL,
  	\`path\` text NOT NULL,
  	\`vendure_product_variant_id\` numeric,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`vendure_product\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vendure_product_variant_id\`) REFERENCES \`vendure_product_variant\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_vendure_product_rels\`("id", "order", "parent_id", "path", "vendure_product_variant_id") SELECT "id", "order", "parent_id", "path", "vendure_product_variant_id" FROM \`vendure_product_rels\`;`)
  await db.run(sql`DROP TABLE \`vendure_product_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_vendure_product_rels\` RENAME TO \`vendure_product_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_order_idx\` ON \`vendure_product_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_parent_idx\` ON \`vendure_product_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_path_idx\` ON \`vendure_product_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_vendure_product_variant_id_idx\` ON \`vendure_product_rels\` (\`vendure_product_variant_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`vendure_product_id\` numeric,
  	\`vendure_product_variant_id\` numeric,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vendure_product_id\`) REFERENCES \`vendure_product\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vendure_product_variant_id\`) REFERENCES \`vendure_product_variant\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "vendure_product_id", "vendure_product_variant_id") SELECT "id", "order", "parent_id", "path", "users_id", "vendure_product_id", "vendure_product_variant_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vendure_product_id_idx\` ON \`payload_locked_documents_rels\` (\`vendure_product_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vendure_product_variant_id_idx\` ON \`payload_locked_documents_rels\` (\`vendure_product_variant_id\`);`)
}
