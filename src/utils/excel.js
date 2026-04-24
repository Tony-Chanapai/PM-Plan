import * as XLSX from 'xlsx'

const PM_LABELS = [
  'รอบ 3 เดือน', 'รอบ 6 เดือน', 'รอบ 9 เดือน', 'รอบ 12 เดือน',
  'รอบ 15 เดือน', 'รอบ 18 เดือน', 'รอบ 21 เดือน', 'รอบสุดท้าย 24 เดือน'
]

function fmtDate(v) {
  if (!v) return ''
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0]
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  return String(v)
}

export function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 })

  // Find header rows (row 0 = main headers, row 1 = sub headers for PM rounds)
  // Data starts at row 2
  const rows = []
  for (let i = 2; i < raw.length; i++) {
    const r = raw[i]
    if (!r[3]) continue // skip if no serial number
    rows.push({
      no: r[0],
      cs_code: r[1] || '',
      model: String(r[2] || '').trim(),
      serial_number: String(r[3] || '').trim(),
      service_type: r[4] || '',
      start: fmtDate(r[5]),
      end: fmtDate(r[6]),
      clinic: r[7] || '',
      location: r[8] || '',
      detail: r[9] || '',
      province: r[10] || '',
      map_url: r[11] || '',
      remark: r[12] || '',
      pm_dates: [
        fmtDate(r[14]), fmtDate(r[15]), fmtDate(r[16]), fmtDate(r[17]),
        fmtDate(r[18]), fmtDate(r[19]), fmtDate(r[20]), fmtDate(r[21])
      ],
      qr_code: r[22] || '',
      sticker_date: fmtDate(r[23]),
    })
  }
  return rows
}

export const PM_ROUND_LABELS = ['3M','6M','9M','12M','15M','18M','21M','24M']
