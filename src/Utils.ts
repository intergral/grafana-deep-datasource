export function serializeParams(data: Record<string, any>): string {
    return Object.keys(data)
        .map((key) => {
            const value = data[key];
            if (Array.isArray(value)) {
                return value.map((arrayValue) => `${encodeURIComponent(key)}=${encodeURIComponent(arrayValue)}`).join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
}
