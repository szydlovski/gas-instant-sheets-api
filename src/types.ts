type TableRecord = Record<string, any>;

interface Table {
	columns: string[];
	data: TableRecord[];
	config: Record<string, any>;
	fields: Record<string, any>;
}

interface IDataProvider {
	listTables: () => string[];
	getTable: (tableName: string) => Table;
	getConfig: () => Record<string, any>
}