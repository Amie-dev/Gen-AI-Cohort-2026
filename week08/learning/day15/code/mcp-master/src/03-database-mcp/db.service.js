export class DatabaseService {
    tables = {
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
    listTables() {
        return Object.keys(this.tables);
    }
    getSchema(tableName) {
        const table = this.tables[tableName.toLowerCase()];
        if (!table)
            throw new Error(`Table '${tableName}' does not exist.`);
        return table.schema;
    }
    searchRecords(tableName, filterKey, filterValue) {
        const table = this.tables[tableName.toLowerCase()];
        if (!table)
            throw new Error(`Table '${tableName}' does not exist.`);
        if (!filterKey || !filterValue) {
            return table.rows;
        }
        return table.rows.filter((row) => String(row[filterKey] || "").toLowerCase().includes(filterValue.toLowerCase()));
    }
    getRecordById(tableName, id) {
        const table = this.tables[tableName.toLowerCase()];
        if (!table)
            throw new Error(`Table '${tableName}' does not exist.`);
        const record = table.rows.find((row) => row.id === id);
        if (!record)
            throw new Error(`Record with ID ${id} not found in '${tableName}'.`);
        return record;
    }
}
