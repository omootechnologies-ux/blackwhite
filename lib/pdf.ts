import { Business, Invoice, Payslip } from '@/types'
import { formatTZS, formatDate, monthLabel } from './utils'

// ============================================================
// PDF generation via Puppeteer
// Uses @sparticuz/chromium for serverless environments
// ============================================================

async function getBrowser() {
  // In production (Vercel/serverless), use stripped Chromium
  if (process.env.NODE_ENV === 'production') {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  // Local dev — use full puppeteer
  const puppeteer = await import('puppeteer-core')
  return puppeteer.launch({
    headless: true,
    executablePath:
      process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome',
  })
}

export async function htmlToPDF(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

// ============================================================
// Invoice HTML Template
// ============================================================
export function renderInvoiceHTML(invoice: Invoice, business: Business): string {
  const itemsHTML = invoice.items
    .map(
      (item) => `
      <tr>
        <td class="desc">${item.description}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${formatTZS(item.unit_price)}</td>
        <td class="num amount">${formatTZS(item.amount)}</td>
      </tr>`
    )
    .join('')

  const logoHTML = business.logo_url
    ? `<img src="${business.logo_url}" alt="${business.name}" class="logo" />`
    : `<div class="logo-placeholder">${business.name.charAt(0)}</div>`

  const statusBadge = {
    draft: '<span class="badge badge-gray">Rasimu</span>',
    sent: '<span class="badge badge-blue">Imetumwa</span>',
    paid: '<span class="badge badge-green">Imelipwa ✓</span>',
    overdue: '<span class="badge badge-red">Imechelewa</span>',
  }[invoice.status]

  return `<!DOCTYPE html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
  .page { padding: 0; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { height: 52px; width: auto; object-fit: contain; }
  .logo-placeholder { width: 52px; height: 52px; background: #1a7a4a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
  .biz-name { font-size: 18px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.3px; }
  .biz-meta { font-size: 9.5px; color: #666; margin-top: 3px; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #1a7a4a; text-transform: uppercase; }
  .invoice-number { font-size: 11px; font-weight: 600; color: #444; margin-top: 4px; }

  /* Parties */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 5px; }
  .party-name { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
  .party-detail { font-size: 9.5px; color: #555; line-height: 1.6; }

  /* Dates row */
  .dates-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #f5f5f2; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .date-item { }
  .date-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin-bottom: 3px; }
  .date-value { font-size: 11px; font-weight: 600; color: #1a1a1a; }

  /* Items table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr { background: #1a1a1a; }
  thead th { padding: 9px 12px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #fff; }
  thead th.num { text-align: right; }
  tbody tr { border-bottom: 1px solid #ebebeb; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 9px 12px; font-size: 10.5px; color: #1a1a1a; }
  td.desc { color: #222; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.amount { font-weight: 600; }

  /* Totals */
  .totals-section { display: flex; justify-content: flex-end; margin-top: 0; }
  .totals-table { width: 260px; }
  .totals-table tr td { padding: 5px 12px; font-size: 10.5px; }
  .totals-table tr td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
  .totals-table .subtotal td { color: #555; }
  .totals-table .vat-row td { color: #555; }
  .totals-table .total-row { border-top: 2px solid #1a1a1a; }
  .totals-table .total-row td { font-size: 13px; font-weight: 800; color: #1a1a1a; padding-top: 8px; }

  /* Payment */
  .payment-section { margin-top: 28px; padding: 16px; background: #f0f9f4; border-radius: 8px; border: 1px solid #bee3cc; }
  .payment-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #1a7a4a; margin-bottom: 8px; }
  .payment-link-label { font-size: 9.5px; color: #444; margin-bottom: 4px; }
  .payment-link { font-size: 10px; font-weight: 600; color: #1a7a4a; word-break: break-all; }
  .mpesa-note { margin-top: 6px; font-size: 9px; color: #666; }

  /* Notes */
  .notes-section { margin-top: 20px; padding: 12px 16px; background: #fafafa; border-radius: 6px; border-left: 3px solid #1a7a4a; }
  .notes-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin-bottom: 4px; }
  .notes-text { font-size: 10px; color: #444; line-height: 1.6; }

  /* Footer */
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
  .footer-brand { font-size: 9px; color: #aaa; }
  .footer-brand strong { color: #666; }
  .footer-powered { font-size: 8.5px; color: #bbb; }

  /* Badges */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .badge-gray { background: #eee; color: #666; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #dcfce7; color: #166534; }
  .badge-red { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="brand">
      ${logoHTML}
      <div>
        <div class="biz-name">${business.name}</div>
        <div class="biz-meta">
          ${business.address ? business.address + '<br>' : ''}
          ${business.phone ? 'Simu: ' + business.phone + '<br>' : ''}
          ${business.email ? business.email + '<br>' : ''}
          ${business.tin ? 'TIN: ' + business.tin : ''}
          ${business.vrn ? ' | VRN: ' + business.vrn : ''}
        </div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number"># ${invoice.number}</div>
      <div style="margin-top:8px">${statusBadge}</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">Kutoka</div>
      <div class="party-name">${business.name}</div>
      <div class="party-detail">
        ${business.address || ''}<br>
        ${business.tin ? 'TIN: ' + business.tin : ''}
      </div>
    </div>
    <div>
      <div class="party-label">Kwenda (Bill To)</div>
      <div class="party-name">${invoice.client_name}</div>
      <div class="party-detail">
        ${invoice.client_phone ? 'Simu: ' + invoice.client_phone + '<br>' : ''}
        ${invoice.client_email ? invoice.client_email + '<br>' : ''}
        ${invoice.client_address ? invoice.client_address + '<br>' : ''}
        ${invoice.client_tin ? 'TIN: ' + invoice.client_tin : ''}
      </div>
    </div>
  </div>

  <div class="dates-row">
    <div class="date-item">
      <div class="date-label">Tarehe ya Invoice</div>
      <div class="date-value">${formatDate(invoice.created_at)}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Tarehe ya Mwisho</div>
      <div class="date-value">${invoice.due_date ? formatDate(invoice.due_date) : 'Haraka iwezekanavyo'}</div>
    </div>
    <div class="date-item">
      <div class="date-label">Sarafu</div>
      <div class="date-value">TZS (Shilingi ya Tanzania)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:45%">Maelezo</th>
        <th class="num" style="width:10%">Idadi</th>
        <th class="num" style="width:20%">Bei/Kipande</th>
        <th class="num" style="width:25%">Jumla</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals-section">
    <table class="totals-table">
      <tbody>
        <tr class="subtotal">
          <td>Jumla Ndogo</td>
          <td>${formatTZS(invoice.subtotal)}</td>
        </tr>
        <tr class="vat-row">
          <td>VAT (${invoice.vat_rate}%)</td>
          <td>${formatTZS(invoice.vat_amount)}</td>
        </tr>
        <tr class="total-row">
          <td>JUMLA KUU</td>
          <td>${formatTZS(invoice.total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${
    invoice.payment_link
      ? `<div class="payment-section">
    <div class="payment-title">Lipa Sasa — Pay Now</div>
    <div class="payment-link-label">Bonyeza au scan link hii kulipa:</div>
    <div class="payment-link">${invoice.payment_link}</div>
    <div class="mpesa-note">Tunakubali: M-Pesa, Airtel Money, Tigo Pesa, kadi ya benki</div>
  </div>`
      : ''
  }

  ${
    invoice.notes
      ? `<div class="notes-section">
    <div class="notes-label">Maelezo / Notes</div>
    <div class="notes-text">${invoice.notes}</div>
  </div>`
      : ''
  }

  <div class="footer">
    <div class="footer-brand">
      <strong>${business.name}</strong> — ${business.phone || ''} — ${business.email || ''}
    </div>
    <div class="footer-powered">
      Imezalishwa na Duka Manager · blackwhite.co.tz
    </div>
  </div>

</div>
</body>
</html>`
}

// ============================================================
// Payslip HTML Template
// ============================================================
export function renderPayslipHTML(payslip: Payslip, business: Business): string {
  const logoHTML = business.logo_url
    ? `<img src="${business.logo_url}" alt="${business.name}" class="logo" />`
    : `<div class="logo-placeholder">${business.name.charAt(0)}</div>`

  const allowancesHTML = payslip.allowances
    .map(
      (a) =>
        `<tr><td class="label">${a.name}</td><td class="num">${formatTZS(a.amount)}</td></tr>`
    )
    .join('')

  const deductionsHTML = [
    { name: 'PAYE (Kodi ya Mapato)', amount: payslip.paye },
    { name: 'NSSF (Mfanyakazi)', amount: payslip.nssf_employee },
    ...payslip.other_deductions,
  ]
    .map(
      (d) =>
        `<tr><td class="label">${d.name}</td><td class="num deduct">(${formatTZS(d.amount)})</td></tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { height: 48px; width: auto; object-fit: contain; }
  .logo-placeholder { width: 48px; height: 48px; background: #1a7a4a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 700; }
  .biz-name { font-size: 16px; font-weight: 700; }
  .biz-meta { font-size: 9px; color: #666; margin-top: 2px; line-height: 1.6; }
  .slip-title { text-align: right; }
  .slip-heading { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; color: #1a7a4a; }
  .slip-period { font-size: 11px; font-weight: 600; color: #444; margin-top: 4px; }

  .employee-box { background: #f5f5f2; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .emp-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #888; margin-bottom: 4px; }
  .emp-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }

  .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 0; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #e5e5e5; }

  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 0; font-size: 10.5px; border-bottom: 1px solid #f0f0f0; }
  td.label { color: #444; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  td.deduct { color: #dc2626; }
  .subtotal-row td { font-weight: 700; font-size: 11px; border-top: 1px solid #ccc; border-bottom: none; padding-top: 8px; }

  .net-pay-box { margin-top: 20px; background: #1a7a4a; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .net-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.05em; }
  .net-sublabel { font-size: 9px; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .net-amount { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; font-variant-numeric: tabular-nums; }

  .nssf-note { margin-top: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; }
  .nssf-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #92400e; margin-bottom: 4px; }
  .nssf-text { font-size: 9.5px; color: #78350f; line-height: 1.5; }

  .sig-section { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sig-line { border-top: 1px solid #ccc; padding-top: 6px; }
  .sig-label { font-size: 9px; color: #888; }

  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e5e5; font-size: 8.5px; color: #bbb; text-align: center; }
</style>
</head>
<body>

  <div class="header">
    <div class="brand">
      ${logoHTML}
      <div>
        <div class="biz-name">${business.name}</div>
        <div class="biz-meta">
          ${business.address || ''}<br>
          ${business.tin ? 'TIN: ' + business.tin : ''}
        </div>
      </div>
    </div>
    <div class="slip-title">
      <div class="slip-heading">Payslip</div>
      <div class="slip-period">${monthLabel(payslip.month)}</div>
    </div>
  </div>

  <div class="employee-box">
    <div>
      <div class="emp-label">Jina la Mfanyakazi</div>
      <div class="emp-value">${payslip.employee_name}</div>
    </div>
    <div>
      <div class="emp-label">Namba ya Mfanyakazi</div>
      <div class="emp-value">${payslip.employee_id || '—'}</div>
    </div>
    <div>
      <div class="emp-label">Cheo / Position</div>
      <div class="emp-value">${payslip.position || '—'}</div>
    </div>
  </div>

  <div class="earnings-deductions">
    <div>
      <div class="section-title">Mapato (Earnings)</div>
      <table>
        <tbody>
          <tr>
            <td class="label">Mshahara wa Msingi</td>
            <td class="num">${formatTZS(payslip.basic_salary)}</td>
          </tr>
          ${allowancesHTML}
          <tr class="subtotal-row">
            <td>Jumla ya Mapato</td>
            <td class="num">${formatTZS(payslip.gross)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="section-title">Makato (Deductions)</div>
      <table>
        <tbody>
          ${deductionsHTML}
          <tr class="subtotal-row">
            <td>Jumla ya Makato</td>
            <td class="num deduct">(${formatTZS(payslip.total_deductions)})</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="net-pay-box">
    <div>
      <div class="net-label">Mshahara wa Mkono</div>
      <div class="net-sublabel">Net Pay — ${monthLabel(payslip.month)}</div>
    </div>
    <div class="net-amount">${formatTZS(payslip.net_pay)}</div>
  </div>

  <div class="nssf-note">
    <div class="nssf-title">Kumbuka — NSSF</div>
    <div class="nssf-text">
      Mchango wa mwajiri (NSSF Employer): ${formatTZS(payslip.nssf_employer)} — haujakatwa kwenye mshahara wako.
      Jumla ya mchango NSSF: ${formatTZS(payslip.nssf_employee + payslip.nssf_employer)}.
    </div>
  </div>

  <div class="sig-section">
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Sahihi ya Mwajiri / Employer Signature</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div class="sig-label">Sahihi ya Mfanyakazi / Employee Signature</div>
    </div>
  </div>

  <div class="footer">
    Hati hii imezalishwa kiotomatiki na Duka Manager · blackwhite.co.tz · ${new Date().toLocaleDateString('sw-TZ')}
  </div>

</body>
</html>`
}
