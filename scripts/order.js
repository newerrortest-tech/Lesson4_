/* Dostaffkin — оформление доставки */
const rates = { xs: 9, s: 13, m: 20, l: 27, xl: 35, max: 70 };
const minimums = { xs: 149, s: 199, m: 249, l: 349, xl: 499, max: 999 };
let selectedSize = 'xs';
let selectedRate = rates.xs;
let selectedSpeed = 'regular';
let route = null;
let routeKm = 0;
let calculation = null;

const $ = (id) => document.getElementById(id);
const fromInput = $('from');
const toInput = $('to');
const calc = $('calc');
const submit = $('submit');

// Сбрасываем старый расчёт при изменении параметров заказа.
function resetCalculation() {
  routeKm = 0;
  calculation = null;
  ['distanceValue', 'durationValue', 'rateValue', 'totalValue'].forEach((id) => {
    $(id).textContent = '—';
  });
  validateOrder();
}

// Размер посылки
document.querySelectorAll('.main-size-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.main-size-card').forEach((c) => c.classList.remove('is-active'));
    card.classList.add('is-active');
    selectedSize = card.dataset.value;
    selectedRate = Number(card.dataset.rate || rates[selectedSize]);
    resetCalculation();
  });
});

// Скорость доставки
document.querySelectorAll('.main-speed-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.main-speed-card').forEach((c) => c.classList.remove('is-active'));
    card.classList.add('is-active');
    selectedSpeed = card.dataset.value;
    resetCalculation();
  });
});

function validateRoute() {
  calc.disabled = !(fromInput.value.trim() && toInput.value.trim());
}
fromInput.addEventListener('input', () => { validateRoute(); resetCalculation(); });
toInput.addEventListener('input', () => { validateRoute(); resetCalculation(); });

function validateOrder() {
  submit.disabled = !($('customerName').value.trim() && $('customerPhone').value.trim() && calculation !== null);
}
$('customerName').addEventListener('input', validateOrder);
$('customerPhone').addEventListener('input', validateOrder);

function showPrice(km) {
  const baseDuration = Math.min(30, 1 + Math.ceil(km / 80));
  let duration = baseDuration;
  let total = Math.max(minimums[selectedSize], Math.ceil(km * selectedRate));

  // По инструкции урока: приоритетная доставка +15% к цене и -30% к сроку.
  if (selectedSpeed === 'fast') {
    total = Math.ceil(total * 1.15);
    duration = Math.ceil(duration * 0.70);
  }

  routeKm = km;
  calculation = {
    from: fromInput.value.trim(),
    to: toInput.value.trim(),
    size: selectedSize,
    speed: selectedSpeed,
    distance: Number(km.toFixed(1)),
    duration,
    rate: selectedRate,
    total
  };

  $('distanceValue').textContent = `${calculation.distance} км`;
  $('durationValue').textContent = `${duration} дн.`;
  $('rateValue').textContent = `${selectedRate} ₽/км`;
  $('totalValue').textContent = `${total.toLocaleString('ru-RU')} ₽`;
  validateOrder();
}

// Карта и расчёт маршрута. Остальной интерфейс работает даже если API недоступен.
if (window.ymaps) {
  ymaps.ready(() => {
    const map = new ymaps.Map('map', { center: [55.751574, 37.573856], zoom: 5, controls: ['zoomControl'] });
    if (typeof ymaps.SuggestView === 'function') {
      new ymaps.SuggestView('from');
      new ymaps.SuggestView('to');
    }

    calc.addEventListener('click', () => {
      resetCalculation();
      if (route) map.geoObjects.remove(route);
      route = new ymaps.multiRouter.MultiRoute(
        { referencePoints: [fromInput.value.trim(), toInput.value.trim()], params: { routingMode: 'auto' } },
        { boundsAutoApply: true }
      );
      map.geoObjects.add(route);
      route.model.events.add('requestsuccess', () => {
        const active = route.getActiveRoute();
        if (!active) { alert('Не удалось построить маршрут.'); return; }
        const meters = active.properties.get('distance').value;
        showPrice(meters / 1000);
      });
      route.model.events.add('requestfail', () => {
        resetCalculation();
        alert('Не удалось построить маршрут. Проверьте адреса или доступность Яндекс Карт.');
      });
    });
  });
} else {
  calc.addEventListener('click', () => {
    alert('Не удалось загрузить Яндекс Карты. Проверьте доступность сервиса и настройки API-ключа.');
  });
}

submit.addEventListener('click', () => {
  if (!calculation) return;
  const id = 'DS' + Date.now().toString().slice(-8);
  $('orderId').textContent = id;
  $('orderForm').style.display = 'none';
  $('orderSuccess').classList.add('is-visible');
  let orders = {};
  try { orders = JSON.parse(localStorage.getItem('dostaffkinOrders') || '{}'); } catch (_) {}
  orders[id] = {
    from: fromInput.value,
    to: toInput.value,
    size: selectedSize,
    speed: selectedSpeed,
    rate: selectedRate,
    distance: calculation.distance,
    duration: calculation.duration,
    total: calculation.total,
    name: $('customerName').value,
    phone: $('customerPhone').value,
    comment: $('comment').value,
    status: 'Создан',
    date: new Date().toLocaleDateString('ru-RU')
  };
  localStorage.setItem('dostaffkinOrders', JSON.stringify(orders));
});
