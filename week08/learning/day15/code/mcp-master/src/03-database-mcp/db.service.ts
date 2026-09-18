export interface TableSchema {
  name: string;
  columns: Array<{ name: string; type: string; primaryKey?: boolean }>;
}

export class DatabaseService {
  private tables: Record<string, { schema: TableSchema; rows: Array<Record<string, any>> }> = {
    users: {
      schema: {
        name: "users",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "name", type: "TEXT" },
          { name: "email", type: "TEXT" },
          { name: "role", type: "TEXT" },
        ],
      },
      rows: [
        { id: 1, name: "Alice Smith", email: "alice@example.com", role: "admin" },
        { id: 2, name: "Bob Jones", email: "bob@example.com", role: "developer" },
        { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "viewer" },
      ],
    },
    orders: {
      schema: {
        name: "orders",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "user_id", type: "INTEGER" },
          { name: "amount", type: "REAL" },
          { name: "status", type: "TEXT" },
        ],
      },
      rows: [
        { id: 101, user_id: 1, amount: 250.0, status: "completed" },
        { id: 102, user_id: 2, amount: 89.99, status: "pending" },
        { id: 103, user_id: 1, amount: 499.5, status: "shipped" },
      ],
    },
  };

  public listTables(): string[] {
    return Object.keys(this.tables);
  }

  public getSchema(tableName: string): TableSchema {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);
    return table.schema;
  }

  public searchRecords(tableName: string, filterKey?: string, filterValue?: string): any[] {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);

    if (!filterKey || !filterValue) {
      return table.rows;
    }

    return table.rows.filter((row) =>
      String(row[filterKey] || "").toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  public getRecordById(tableName: string, id: number): any {
    const table = this.tables[tableName.toLowerCase()];
    if (!table) throw new Error(`Table '${tableName}' does not exist.`);
    const record = table.rows.find((row) => row.id === id);
    if (!record) throw new Error(`Record with ID ${id} not found in '${tableName}'.`);
    return record;
  }
}
