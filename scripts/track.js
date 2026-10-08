const input = document.getElementById('trackNumber');
const button = document.getElementById('trackButton');
const result = document.getElementById('trackResult');

function trackOrder() {
  const id = input.value.trim();
  if (!id) return;
  let orders = {};
  try { orders = JSON.parse(localStorage.getItem('dostaffkinOrders') || '{}'); } catch (_) {}
  const order = orders[id];
  result.classList.add('is-visible');
  if (!order) {
    document.getElementById('trackIdValue').textContent = `Посылка № ${id}`;
    document.getElementById('trackFromValue').textContent = 'Отправление не найдено';
    document.getElementById('trackToValue').textContent = 'Проверьте номер заказа. Данные хранятся только в этом браузере.';
    document.getElementById('trackStatusList').replaceChildren();
    return;
  }
  document.getElementById('trackIdValue').textContent = `Посылка № ${id}`;
  document.getElementById('trackFromValue').textContent = `Откуда: ${order.from}`;
  document.getElementById('trackToValue').textContent = `Куда: ${order.to}`;
  const statuses = [
    ['created', 'Создан', '✓'],
    ['in-way', 'В пути', '→'],
    ['ready', 'Готов к выдаче', '⌂'],
    ['done', 'Вручен', '✓']
  ];
  const current = statuses.findIndex((s) => s[1] === order.status);
  const list = document.getElementById('trackStatusList');
  list.replaceChildren();
  statuses.forEach(([css, label, icon], i) => {
    const item = document.createElement('div');
    item.className = `track-status ${css}`;
    const symbol = document.createElement('div');
    symbol.className = 'track-status-icon';
    symbol.textContent = icon;
    const info = document.createElement('div');
    info.className = 'track-status-text';
    const title = document.createElement('div');
    title.textContent = label;
    const date = document.createElement('div');
    date.className = 'track-status-text-date';
    date.textContent = i === 0 ? (order.date || '—') : '—';
    info.append(title, date);
    item.append(symbol, info);
    if (i > current) item.style.opacity = '0.45';
    list.append(item);
  });
}
button.addEventListener('click', trackOrder);
input.addEventListener('keydown', (event) => { if (event.key === 'Enter') trackOrder(); });
