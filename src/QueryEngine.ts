class QueryEngine {
	private dataProvider: any;
	public constructor(dataProvider) {
		this.dataProvider = dataProvider;
	}
	public exec(q) {
		switch (q.type) {
			case 'get':
				return this.get(q);
			case 'find':
				return this.find(q);
			case 'list':
				return this.list(q);
			default:
				throw new EngineError(`Unknown query type: ${q.type}`);
		}
	}
	public get(q) {
		const records = this.dataProvider.getTable(q.table).data;
		const result = records.find((record) => record[q.field] == q.value);
		if (!result)
			throw new EngineError(
				`Record not found in get query: from ${q.table} where ${q.field}=${q.value}`
			);
		return result;
	}
	public find(q) {
		const records = this.dataProvider.getTable(q.table).data;
		if (q.value !== undefined) {
			return records.filter((record) => record[q.field] === q.value);
		} else if (q.values !== undefined) {
			return records.filter((record) => q.values?.includes(record[q.field]));
		} else {
			throw new EngineError('No search value or values provided in find query');
		}
	}
	public list(q) {
		return this.dataProvider.getTable(q.table).data;
	}
	public static using(dataProvider) {
		return new QueryEngine(dataProvider);
	}
}
