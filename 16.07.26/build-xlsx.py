# Builds report-16.07.26.xlsx — a compact summary of the day's admin Drivers/Dispatchers work.
# Run: python build-xlsx.py
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'report-16.07.26.xlsx')

BLUE = '1639C8'; DARK = '0F1D4F'; GREEN = '00B87A'; OKG = '0F9D58'
LINE = 'E6E9F0'; MUTEDBG = 'FAFBFE'
thin = Side(style='thin', color=LINE)
border = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(vertical='top', wrap_text=True)
top = Alignment(vertical='top')

wb = Workbook()

# ── Sheet 1: Changes ────────────────────────────────────────────────────────────────
ws = wb.active
ws.title = 'Changes'
ws.sheet_view.showGridLines = False

title = ws.cell(row=1, column=1, value='Sarbon Admin — Drivers & Dispatchers · 16.07.2026')
title.font = Font(bold=True, size=15, color=DARK)
ws.cell(row=2, column=1,
        value='Account status «No data» → effective; activate bug fixed; Account/KYC/Moderation editable in Edit drawer; actions slimmed to View/Edit/Delete.'
        ).font = Font(size=10, color='5B6477', italic=True)
ws.merge_cells('A2:F2')

headers = ['#', 'Type', 'Area', 'Change', 'Endpoint / detail', 'Screenshot']
hr = 4
for c, h in enumerate(headers, start=1):
    cell = ws.cell(row=hr, column=c, value=h)
    cell.font = Font(bold=True, size=10, color='FFFFFF')
    cell.fill = PatternFill('solid', fgColor=BLUE)
    cell.alignment = Alignment(vertical='center', horizontal='left')
    cell.border = border

rows = [
    ['0', 'FIX', 'Root cause',
     'FE rendered raw nullable account_status; used effective_status (COALESCE→active) instead',
     'Driver.effective_status', '—'],
    ['1', 'FIX', 'Drivers',
     'Account column shows effective status — no more "No data"; also feeds sort/filter/isBlocked',
     'GET /v1/admin/drivers', '01, 05'],
    ['2', 'UI', 'Drivers + Dispatchers',
     'Actions column slimmed to View / Edit / Delete; "Send to moderation" removed from the row',
     '—', '02, 07'],
    ['3', 'FEATURE', 'Drivers',
     'Account / KYC / Moderation editable inside the Edit drawer (AdminDriverStatusEditor)',
     '/kyc/accept·reject, /moderation/approve·reject·resubmit', '03'],
    ['4', 'FIX', 'Drivers',
     'Activate no longer offered on an already-active row (was 400 on null); resubmit gated to rejected',
     '/moderation/{activate,inactive,resubmit}', '04'],
    ['5', 'FIX', 'Dispatchers',
     'Edit drawer moderation section keyed on moderation_status; isBlocked read from moderation_status',
     '/moderation/{activate,inactive,block,unblock,resubmit}', '06, 08, 09, 10'],
    ['6', 'UI', 'i18n',
     'New keys resubmitOnlyRejected + accountMenuLabel across all 15 locales',
     'admin.moderationActions.*', '—'],
]
type_fill = {'FIX': OKG, 'FEATURE': GREEN, 'UI': '7C3AED'}
r = hr + 1
for row in rows:
    for c, val in enumerate(row, start=1):
        cell = ws.cell(row=r, column=c, value=val)
        cell.border = border
        cell.alignment = wrap if c in (4, 5) else top
        cell.font = Font(size=10)
        if c == 2:
            cell.font = Font(size=9, bold=True, color='FFFFFF')
            cell.fill = PatternFill('solid', fgColor=type_fill.get(val, '64748B'))
            cell.alignment = Alignment(vertical='center', horizontal='center')
    r += 1

widths = [5, 10, 20, 52, 46, 14]
for i, w in enumerate(widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = w
for rr in range(hr + 1, r):
    ws.row_dimensions[rr].height = 42

# ── Sheet 2: Verification ─────────────────────────────────────────────────────────────
ws2 = wb.create_sheet('Verification')
ws2.sheet_view.showGridLines = False
ws2.cell(row=1, column=1, value='Verification gates').font = Font(bold=True, size=14, color=DARK)
gates = [
    ['Gate', 'Result'],
    ['pnpm build (tsc -b + vite)', 'exit 0'],
    ['eslint --max-warnings 0 (changed files)', 'clean'],
    ['vitest run', '1754 / 1754 (165 files)'],
    ['Locale parity', '2 new keys × 15 locales'],
    ['Live run (staging, admin login)', '10 screenshots, behaviour confirmed'],
    ['Files changed', '13'],
]
gr = 3
for i, (a, b) in enumerate(gates):
    ca = ws2.cell(row=gr + i, column=1, value=a)
    cb = ws2.cell(row=gr + i, column=2, value=b)
    for cell in (ca, cb):
        cell.border = border
        cell.alignment = top
    if i == 0:
        for cell in (ca, cb):
            cell.font = Font(bold=True, size=10, color='FFFFFF')
            cell.fill = PatternFill('solid', fgColor=BLUE)
    else:
        ca.font = Font(size=10)
        cb.font = Font(size=10, bold=True, color=OKG)
ws2.column_dimensions['A'].width = 42
ws2.column_dimensions['B'].width = 34

wb.save(OUT)
print('wrote', OUT)
