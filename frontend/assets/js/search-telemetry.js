(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.MEDICostSearchTelemetry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function compactText(value, maxLength) {
        if (typeof value !== 'string') return '';
        return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
    }

    function normalizePath(value) {
        const path = compactText(value, 200);
        return path.startsWith('/') ? path : '/calculator';
    }

    function itemId(item) {
        return compactText(
            item?.publicActionCode || item?.actionCode || item?.ediCode
                || item?.code || item?.type || item?.id || '',
            100
        );
    }

    function itemName(item) {
        return compactText(item?.name || item?.typeName || '', 200);
    }

    function buildSearchLogPayload(query, resultCount, path) {
        const cleanQuery = compactText(query, 100);
        if (cleanQuery.length < 2) return null;
        const count = Number(resultCount);
        return {
            query: cleanQuery,
            resultCount: Number.isFinite(count) ? Math.max(0, Math.min(Math.round(count), 100000)) : 0,
            path: normalizePath(path)
        };
    }

    function buildSearchClickPayload(searchQuery, item, path) {
        const cleanQuery = compactText(searchQuery, 100);
        const clickedItemId = itemId(item);
        const clickedItemName = itemName(item);
        if (cleanQuery.length < 2 || !clickedItemId || !clickedItemName) return null;
        return {
            searchQuery: cleanQuery,
            clickedItemId,
            clickedItemName,
            path: normalizePath(path)
        };
    }

    return { buildSearchLogPayload, buildSearchClickPayload };
});
