class EngineError extends Error {
	constructor(message) {
		super(message);
		this.name = 'EngineError';
	}
}

class App {
	public constructor(private readonly dataProvider) {}
	public handleRequest(req: GoogleAppsScript.Events.DoGet) {
		const config = this.dataProvider.getConfig();
		if (config.CONFIG_API_DISABLED) {
			throw new Error('This API is disabled.');
		}
		try {
			if (Object.keys(req.parameter).length === 0) {
				const template = this.createDocsTemplate();
				return template.evaluate();
			}
			if (config.REQUIRE_API_KEY) {
				return 'daj mi ten klucz człowieku';
			}
			let data = QueryEngine.using(this.dataProvider).exec(
				this.formatQueryFromRequest(req)
			);
			if (req.parameter.nested) {
				data = Array.isArray(data)
					? data.map((record) => expandObjectKeys(record))
					: expandObjectKeys(data);
			}
			return ContentService.createTextOutput(
				JSON.stringify(data, null, 4)
			).setMimeType(ContentService.MimeType.JSON);
		} catch (error) {
			if (error instanceof EngineError || error?.name === 'EngineError') {
				return this.returnError(req, error?.message ?? 'Unknown error');
			} else {
				throw error;
			}
		}
	}
	private returnError(req, message) {
		return Object.assign(HtmlService.createTemplateFromFile('templates/error'), {
			metadata: {
				error: {
					request: req,
					error: message,
				},
			},
		}).evaluate();
	}
	private getDataManifest() {
		const capitalize = (str) =>
			str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
		const unmultiply = (str) => str.substring(0, str.length - 1);
		return this.dataProvider.listTables()
			.map((tableName) => this.dataProvider.getTable(tableName))
			.map(({ name: tableName, columns, data, config, fields }) => ({
				name: capitalize(tableName),
				url: tableName,
				description: config.description,
				fields: columns.map((key) => ({
					name: key,
					type: typeof data.find((record) => record[key] !== undefined)?.[key],
					description: fields[key],
				})),
				endpoints: [
					{
						name: `Get ${unmultiply(tableName.toLowerCase())}`,
						method: 'GET',
						url: `?q=get&t=${tableName.toLowerCase()}`,
						description: `Retrieve the first ${unmultiply(
							tableName
						)} which matches the provided condition, expressed as a field and value pair.`,
						response: JSON.stringify(
							data
								.map((record) => ({
									record,
									values: Object.values(record).reduce<number>(
										(total, next) => (next === '' ? total : total + 1),
										0
									),
								}))
								.reduce(
									(max, next) => (next.values > max.values ? next : max),
									{ values: 0 }
								).record,
							null,
							4
						),
						params: [
							{
								name: 'field',
								type: 'string',
								required: true,
								description: 'The field to search for the provided value.',
							},
							{
								name: 'value',
								type: 'any',
								required: true,
								description: 'The value to look for.',
							},
						],
					},
					{
						name: `Find ${tableName.toLowerCase()}`,
						method: 'GET',
						url: `?q=find&t=${tableName.toLowerCase()}`,
						description: `Retrieve all ${tableName} which match the provided condition, expressed as a field and one or more values.`,
						response: JSON.stringify(data.slice(0, 3), null, 4),
						params: [
							{
								name: 'field',
								type: 'string',
								required: true,
								description:
									'The field to search for the provided value or values.',
							},
							{
								name: 'value',
								type: 'any',
								required: true,
								description: 'The value or values to look for.',
							},
						],
					},
					{
						name: `List ${tableName.toLowerCase()}`,
						method: 'GET',
						url: `?q=list&t=${tableName.toLowerCase()}`,
						description: `Retrieve all ${tableName}.`,
						response: JSON.stringify(data.slice(0, 3), null, 4),
						params: [],
					},
				],
			}));
	}
	private createDocsTemplate(metadata = {}) {
		const config = this.dataProvider.getConfig();
		const tables = this.getDataManifest();
		return Object.assign(HtmlService.createTemplateFromFile('templates/docs'), {
			metadata: { ...metadata, config, tables },
		});
	}
	private formatQueryFromRequest(req) {
		const { q: queryType, t: tableName, field, value } = req.parameter ?? {};
		const { values } = req.parameters ?? {};
		if (!['get', 'find', 'list'].includes(queryType)) {
			throw new EngineError(`Unknown query type: ${queryType}`);
		}
		return {
			type: queryType,
			table: tableName,
			field,
			value,
			values,
		};
	}
}
