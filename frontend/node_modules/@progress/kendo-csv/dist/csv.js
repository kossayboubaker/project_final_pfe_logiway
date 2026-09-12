"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCSVBlob = exports.getCSVMimeType = exports.toCSV = exports.getNestedValue = void 0;
const CRLF = "\r\n";
// Type definitions
/**
 * @hidden
 */
function getNestedValue(fieldName, dataItem) {
    const path = (fieldName ?? '').split('.');
    let data = dataItem;
    for (const p of path) {
        // Security: Block access to prototype chain properties
        if (p === '__proto__' || p === 'constructor' || p === 'prototype') {
            return undefined;
        }
        data = data ? data[p] : undefined;
    }
    return data;
}
exports.getNestedValue = getNestedValue;
/**
 * Extracts and flattens data rows from a DataResult, handling grouped data.
 * For grouped data, inserts group header rows before the group items.
 * Returns both the flattened data and the list of grouped field names.
 */
function getDataRowsFromDataResult(dataResult, keys, delimiter = ',', groupValueFormatter) {
    const data = dataResult.data;
    if (data.length > 0 &&
        typeof data[0] === 'object' &&
        'field' in data[0] &&
        'value' in data[0] &&
        'items' in data[0]) {
        const groupedFields = [];
        const rows = flattenGroupedData(data, keys, 0, groupedFields, [], delimiter, groupValueFormatter);
        return { rows, groupedFields };
    }
    return { rows: data, groupedFields: [] };
}
/**
 * Checks if an item is a GroupResult (nested group).
 */
function isGroupResult(item) {
    return typeof item === 'object' && 'field' in item && 'items' in item;
}
/**
 * Creates a group header row with concatenated group values.
 */
function createGroupHeaderRow(groupedFields, groupValues, keys, delimiter, groupValueFormatter) {
    const groupHeaderRow = {};
    const concatenatedValue = groupValueFormatter
        ? groupValueFormatter(groupValues, groupedFields)
        : groupValues.join('/');
    if (groupValueFormatter && typeof concatenatedValue === 'string' && concatenatedValue.includes(delimiter)) {
        throw new Error(`groupValueFormatter returned a string containing the CSV delimiter '${delimiter}'. Formatted value: "${concatenatedValue}"`);
    }
    // Place the group value in the __group__ column
    groupHeaderRow['__group__'] = concatenatedValue;
    // Fill all original columns with empty strings
    for (const key of keys) {
        groupHeaderRow[key] = '';
    }
    return groupHeaderRow;
}
/**
 * Processes a data item row for grouped data.
 */
function processDataItemRow(item, keys) {
    if (keys && typeof item === 'object' && !Array.isArray(item)) {
        const row = { ...item };
        // Set __group__ column to empty for data rows
        row['__group__'] = '';
        return row;
    }
    return item;
}
/**
 * Recursively flattens grouped data into CSV rows with group headers.
 * Also collects the grouped field names in order.
 */
function flattenGroupedData(groups, keys, depth = 0, groupedFields = [], groupValues = [], delimiter = ',', groupValueFormatter) {
    const result = [];
    for (const group of groups) {
        if (depth === groupedFields.length) {
            groupedFields.push(group.field);
        }
        const currentGroupValues = [...groupValues, group.value];
        if (group.items.length > 0) {
            const firstItem = group.items[0];
            if (isGroupResult(firstItem)) {
                result.push(...flattenGroupedData(group.items, keys, depth + 1, groupedFields, currentGroupValues, delimiter, groupValueFormatter));
            }
            else {
                if (keys) {
                    result.push(createGroupHeaderRow(groupedFields, currentGroupValues, keys, delimiter, groupValueFormatter));
                }
                group.items.forEach((item) => {
                    result.push(processDataItemRow(item, keys));
                });
            }
        }
    }
    return result;
}
/**
 * Updates header names for grouped data by concatenating grouped field display names.
 */
function updateHeaderNamesForGrouping(groupedFields, headerNames, keys, delimiter, groupHeaderFormatter) {
    const groupedDisplayNames = groupedFields.map(field => {
        const fieldIndex = keys.indexOf(field);
        return fieldIndex >= 0 ? headerNames[fieldIndex] : field;
    });
    const groupedHeader = groupHeaderFormatter
        ? groupHeaderFormatter(groupedDisplayNames)
        : groupedDisplayNames.join('/');
    if (groupHeaderFormatter && groupedHeader.includes(delimiter)) {
        throw new Error(`groupHeaderFormatter returned a string containing the CSV delimiter '${delimiter}'. Formatted value: "${groupedHeader}"`);
    }
    // Prepend the grouped header to the original names
    return [groupedHeader, ...headerNames];
}
function toCSV({ data, names = null, keys = names, delimiter = ",", lineSeparator = CRLF, preventFormulaInjection = true, maxCellLength = 32767, maxRows = 1000000, maxColumns = 1000, includeUTF8BOM = false, groupHeaderFormatter, groupValueFormatter }) {
    let dataRows;
    let headerNames = names;
    let actualKeys = keys;
    // Security: Validate delimiter
    if (!delimiter || /[\r\n]/.test(delimiter) || (delimiter.length > 1 && delimiter !== "\t")) {
        delimiter = ",";
    }
    if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
        const result = getDataRowsFromDataResult(data, keys, delimiter, groupValueFormatter);
        dataRows = result.rows;
        if (result.groupedFields.length > 0 && keys) {
            if (headerNames) {
                headerNames = updateHeaderNamesForGrouping(result.groupedFields, headerNames, keys, delimiter, groupHeaderFormatter);
            }
            // Prepend __group__ to keys to match the data structure
            actualKeys = ['__group__', ...keys];
        }
    }
    else {
        dataRows = data;
    }
    // Security: Validate keys if provided
    if (keys && !Array.isArray(keys)) {
        throw new Error("toCSV: keys must be an array");
    }
    // Security: Limit number of columns to prevent DoS
    if (actualKeys && actualKeys.length > maxColumns) {
        actualKeys = actualKeys.slice(0, maxColumns);
        if (headerNames && headerNames.length > maxColumns) {
            headerNames = headerNames.slice(0, maxColumns);
        }
    }
    // Security: Limit data size to prevent DoS
    if (dataRows.length > maxRows) {
        dataRows = dataRows.slice(0, maxRows);
    }
    let csv = includeUTF8BOM ? "\uFEFF" : "";
    if (headerNames) {
        renderRow(headerNames);
    }
    dataRows.forEach(renderRow);
    return csv;
    function renderRow(row) {
        if (Array.isArray(row)) {
            csv += row.map(encodeCell).join(delimiter);
        }
        else {
            if (!actualKeys) {
                throw new Error("toCSV: `keys` argument is mandatory for non-array data rows");
            }
            if (row instanceof Map) {
                csv += actualKeys.map((name) => encodeCell(row.get(name))).join(delimiter);
            }
            else {
                // assumes plain objects
                csv += actualKeys.map((name) => encodeCell(getNestedValue(name, row))).join(delimiter);
            }
        }
        csv += lineSeparator;
    }
    function encodeCell(value) {
        if (value == null) {
            return "";
        }
        // Handle Date objects
        if (value instanceof Date) {
            return value.toISOString();
        }
        let stringValue = String(value);
        // Security: Formula injection protection
        // Prevent formulas from being executed in spreadsheet applications
        // Check: 1) at start of string (with optional whitespace), OR 2) immediately after newline/carriage return
        // This catches '\n=1+1', ' =1+1', '  @cmd' but NOT 'text - more' (dash in middle)
        // Exception: Don't treat valid numbers (including negative) as formulas
        if (preventFormulaInjection && (/^\s*[=+\-@\t\r]/.test(stringValue) || /[\n\r]\s*[=+\-@\t\r]/.test(stringValue))) {
            // Check if it's a valid number - if so, don't apply protection
            const isNumber = typeof value === 'number';
            if (!isNumber) {
                stringValue = "'" + stringValue;
            }
        }
        // Security: Limit cell size to prevent DoS and Excel compatibility
        if (stringValue.length > maxCellLength) {
            stringValue = stringValue.substring(0, maxCellLength);
        }
        // CSV encoding: Quote cells with special characters
        if ([delimiter, '\n', '\r', '"'].some((del) => stringValue.includes(del))) {
            stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }
}
exports.toCSV = toCSV;
function getCSVMimeType(options) {
    let type = "text/csv; charset=UTF-8";
    if (options.names) {
        type += "; header=present";
    }
    return type;
}
exports.getCSVMimeType = getCSVMimeType;
/**
 * Converts data to a CSV Blob ready for download or upload.
 * This is a convenience function that combines toCSV() and Blob creation.
 *
 * @param options - CSV export options (same as toCSV)
 * @returns A Blob containing the CSV data with proper MIME type
 *
 * @example
 * const blob = toCSVBlob({ data: employees, keys: ['id', 'name'], names: ['ID', 'Name'] });
 * saveAs(blob, 'employees.csv');
 */
function toCSVBlob(options) {
    const csvString = toCSV(options);
    return new Blob([csvString], { type: getCSVMimeType(options) });
}
exports.toCSVBlob = toCSVBlob;
