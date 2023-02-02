class SpreadsheetDataProvider implements IDataProvider {
	public listTables() {
		const namedRanges = this._getNamedRanges();
		return Object.keys(namedRanges).reduce<string[]>((tables, rangeName) => {
			const match = rangeName.match(/^api_table_data_(.*)$/);
			if (!match) return tables;
			const [_, tableName] = match;
			return [...tables, tableName];
		}, []);
	}
	public getConfig() {
		const namedRanges = this._getNamedRanges();
		const configRange = namedRanges['api_config'];
		return configRange ? this._getDictionaryFromRange(configRange) : {};
	}
	public getTable(tableName) {
		const namedRanges = this._getNamedRanges();
		const dataRange = namedRanges[`api_table_data_${tableName}`];
		const fieldsRange = namedRanges[`api_table_fields_${tableName}`];
		const configRange = namedRanges[`api_table_config_${tableName}`];
		if (!dataRange) throw new Error(`Table not found: ${tableName}`);
		const dataRows = this._filterEmptyRows(dataRange.getValues());
		const [columns, ...records] = dataRows;
		const data = records.map((record) =>
			Object.fromEntries(
				columns.map((column, index) => [column, record[index]])
			)
		);
		return {
			name: tableName,
			columns,
			data,
			fields: fieldsRange ? this._getDictionaryFromRange(fieldsRange) : {},
			config: configRange ? this._getDictionaryFromRange(configRange) : {},
		};
	}
	// helpers
	private _getNamedRanges() {
		return Object.fromEntries(
			SpreadsheetApp.getActiveSpreadsheet()
				.getNamedRanges()
				.map((range) => [range.getName(), range.getRange()])
		);
	}
	private _filterEmptyRows(rows) {
		return rows.filter((row) => !row.every((value) => value === ''));
	}
	private _getDictionaryFromRange(range) {
		return Object.fromEntries(
			this._filterEmptyRows(range.getValues()).map(([key, value]) => [
				key,
				value,
			])
		);
	}
}
