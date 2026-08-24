import { postgresDb } from "../../infrastructure/postgres.js";

/**
 * PostgreSQL Adapter
 */
export class PostgresAdapter {
  static async search(query, userContext = {}) {
    const projects = await postgresDb.queryUserProjects(userContext.userId || "user_aminul_101");
    return projects.map((p) => ({
      id: `pg_${p.id}`,
      source: "postgresql",
      title: p.title,
      content: `User Project ${p.title} utilizes ${p.dbType} and technology stack ${p.tech}.`,
      acl: "user_private",
    }));
  }
}
