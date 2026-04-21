const CSV_BOM = '\uFEFF'
const CSV_NEWLINE = '\r\n'
const CSV_DELIMITER = ','

export type CsvCell = string | number | null | undefined

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  const needsQuoting =
    str.includes(CSV_DELIMITER) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  if (!needsQuoting) return str
  return `"${str.replace(/"/g, '""')}"`
}

export function buildCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(CSV_DELIMITER)).join(CSV_NEWLINE)
}

export function downloadCsv(filename: string, rows: CsvCell[][]): void {
  const csvBody = buildCsv(rows)
  const blob = new Blob([CSV_BOM + csvBody], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export function buildSectionedCsv(sections: Array<{ title: string; rows: CsvCell[][] }>): CsvCell[][] {
  const result: CsvCell[][] = []
  sections.forEach((section, idx) => {
    if (idx > 0) result.push([])
    result.push([section.title])
    result.push(...section.rows)
  })
  return result
}
