const XLSX = require('xlsx');
const wb = XLSX.readFile('c:/Users/Alfonso Ison/IZ ERP/Remesas Olmos Claude.xlsx');
const ws = wb.Sheets['BD Remesas'];
const d = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

const remesas = {};
for (let i = 4; i < d.length; i++) {
  const r = d[i];
  const num = r[3];
  if (num === '' || num === undefined) continue;
  if (!(num in remesas)) {
    remesas[num] = { n: num, dt: r[2], cnt: 0, tot: 0, lines: [] };
  }
  remesas[num].cnt++;
  remesas[num].tot += (parseFloat(r[12]) || 0);
  remesas[num].lines.push({
    date: r[2],
    category: r[5] || '',
    subcategory: r[6] || '',
    contractor: r[7] || '',
    description: r[8] || '',
    amount: parseFloat(r[9]) || 0,
    vat_pct: parseFloat(r[10]) || 0,
    vat_amount: parseFloat(r[11]) || 0,
    total: parseFloat(r[12]) || 0,
    payment_type: r[13] || '',
    bank: r[14] || '',
    account: r[15] || '',
    clabe: r[16] || '',
    notes: r[17] || '',
  });
}

const sorted = Object.values(remesas).sort((a, b) => a.n - b.n);
console.log('Unique remesas:', sorted.length);
sorted.forEach(r => {
  console.log(`\nRemesa #${r.n} | date=${r.dt} | lines=${r.cnt} | total=$${r.tot.toFixed(2)}`);
  r.lines.slice(0, 3).forEach((l, i) => {
    console.log(`  ${i+1}. ${l.contractor} | ${l.description.substring(0,50)} | $${l.total} | ${l.payment_type}`);
  });
  if (r.cnt > 3) console.log(`  ... and ${r.cnt - 3} more lines`);
});
