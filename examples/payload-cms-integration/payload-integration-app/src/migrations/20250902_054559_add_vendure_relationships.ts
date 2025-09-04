import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    // Migration code
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    // Migration code
}
