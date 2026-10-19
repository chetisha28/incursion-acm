export function formatDate(value, timeZone) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: safeZone(timeZone) }).format(date);
}

export function formatLongDate(value, timeZone) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: safeZone(timeZone) }).format(date);
}

export function formatTime(value, timeZone) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', timeZone: safeZone(timeZone) }).format(date);
}

export function formatRange(start, end, timeZone) {
  return `${formatTime(start, timeZone)}${end ? ` — ${formatTime(end, timeZone)}` : ''}`;
}

export function safeZone(zone) {
  if (!zone) return 'UTC';
  try { new Intl.DateTimeFormat('en', { timeZone: zone }); return zone; }
  catch { return 'UTC'; }
}

export function toLocalInput(value, timeZone) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeZone(timeZone), year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function localInputToIso(value, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value || ''))) throw new Error('Enter a valid date and time.');
  const [datePart, timePart] = String(value || '').split('T');
  const [year, month, day] = (datePart || '').split('-').map(Number);
  const [hour, minute] = (timePart || '').split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) throw new Error('Enter a valid date and time.');
  const zone = safeZone(timeZone);
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = desiredWallTime;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  for (let index = 0; index < 3; index += 1) {
    const parts = formatter.formatToParts(new Date(timestamp)).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
    const renderedWallTime = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    timestamp += desiredWallTime - renderedWallTime;
  }
  const check = formatter.formatToParts(new Date(timestamp)).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  if (Number(check.year) !== year || Number(check.month) !== month || Number(check.day) !== day || Number(check.hour) !== hour || Number(check.minute) !== minute) {
    throw new Error('That local time does not exist in the selected timezone. Choose another time.');
  }
  return new Date(timestamp).toISOString();
}

export function dateStamp(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '---' };
  const parts = new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', timeZone: safeZone(timeZone) }).formatToParts(date);
  return { day: parts.find((part) => part.type === 'day')?.value || '--', month: parts.find((part) => part.type === 'month')?.value || '---' };
}

export function formatINR(value) {
  if (value === null || value === undefined || value === '') return '₹0.00';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (Number.isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
}

