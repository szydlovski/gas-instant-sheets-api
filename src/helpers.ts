function expandObjectKeys<T = any>(target: any): T {
	const result = {};
	for (const [keyPath, value] of Object.entries(target)) {
		const keys = keyPath.split('.');
		let current = result;
		while (keys.length > 0) {
			const key = keys.shift()!;
			if (keys.length === 0) {
				current[key] = value;
			} else {
				if (current[key] === undefined) current[key] = {};
				current = current[key];
			}
		}
	}
	return result as T;
}
