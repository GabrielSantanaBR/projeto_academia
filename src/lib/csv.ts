/** Prevent spreadsheet formulas in exported, untrusted fields. */
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function toCsv(rows: unknown[][]) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n'); }
