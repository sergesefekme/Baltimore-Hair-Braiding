/**
 * Minimal RFC 4180 CSV parser.
 *
 * Written by hand rather than pulling in a dependency: the service menu is the
 * only CSV this site reads, and it needs exactly one feature beyond `split(",")`
 * — quoted fields containing commas, which every description in the menu has.
 *
 * Handles: quoted fields, escaped quotes (`""`), CRLF and LF, trailing newline.
 * Does not handle: multi-line quoted fields (the menu has none).
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Strip BOM — Excel adds one when saving as CSV UTF-8.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      // Swallow the LF of a CRLF pair.
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  // Final field, unless the file ended on a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** Parse a CSV with a header row into keyed records. */
export function parseCsvRecords(input: string): Record<string, string>[] {
  const rows = parseCsv(input);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim());

  return rows.slice(1).map((cells) =>
    Object.fromEntries(
      header.map((key, i) => [key, (cells[i] ?? "").trim()]),
    ),
  );
}
