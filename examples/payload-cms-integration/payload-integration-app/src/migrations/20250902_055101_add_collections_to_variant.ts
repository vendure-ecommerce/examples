import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`vendure_product_variant_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` numeric NOT NULL,
  	\`path\` text NOT NULL,
  	\`vendure_collection_id\` numeric,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`vendure_product_variant\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vendure_collection_id\`) REFERENCES \`vendure_collection\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`vendure_product_variant_rels_order_idx\` ON \`vendure_product_variant_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_variant_rels_parent_idx\` ON \`vendure_product_variant_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_variant_rels_path_idx\` ON \`vendure_product_variant_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`vendure_product_variant_rels_vendure_collection_id_idx\` ON \`vendure_product_variant_rels\` (\`vendure_collection_id\`);`)
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`vendure_product_variant_rels\`;`)
  await db.run(sql`ALTER TABLE \`vendure_product_rels\` ADD \`vendure_collection_id\` numeric REFERENCES vendure_collection(id);`)
  await db.run(sql`CREATE INDEX \`vendure_product_rels_vendure_collection_id_idx\` ON \`vendure_product_rels\` (\`vendure_collection_id\`);`)
}
