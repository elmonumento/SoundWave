import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "mysql://root:@127.0.0.1:3306/soundwave";
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const schema = await readFile(resolve(process.cwd(), "database/schema.sql"), "utf8");
    const statements = schema
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`SoundWave database is ready (${statements.length} idempotent schema statements).`);
  } finally {
    await connection.end();
  }
}

setupDatabase().catch((error: unknown) => {
  console.error("Could not initialize the SoundWave database:", error);
  process.exitCode = 1;
});
