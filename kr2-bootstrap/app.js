'use strict';

const gameTitles = {
  carcassonne: 'Каркассон',
  catan: 'Колонизаторы',
  'ticket-to-ride': 'Билет на поезд',
  azul: 'Азул',
  dixit: 'Диксит',
  codenames: 'Кодовые имена',
  pandemic: 'Пандемия',
  splendor: 'Роскошь',
};

const tablesPerSlot = 3;

function remainingTables(requests, { date, zone, time }) {
  const occupied = requests.filter(request =>
    request.type === 'booking'
    && request.date === date
    && request.zone === zone
    && request.time === time
  ).length;
  return Math.max(0, tablesPerSlot - occupied);
}

function tableCountLabel(count) {
  if (count === 0) return 'Нет мест';
  return count === 1 ? '1 стол' : `${count} стола`;
}

function loadItems(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveItems(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function setupCatalog() {
  const filters = document.querySelector('[data-catalog-filters]');
  if (!filters) return;

  const catalog = document.querySelector('[data-catalog]');
  const cards = [...catalog.children];
  const empty = document.querySelector('[data-catalog-empty]');
  const sort = document.querySelector('[data-catalog-sort]');

  function update() {
    const values = new FormData(filters);
    const query = values.get('search').trim().toLocaleLowerCase('ru');
    const genre = values.get('genre');
    const players = Number(values.get('players'));
    const duration = Number(values.get('duration'));
    const favorites = loadItems('mipl-favorites');
    const sorted = [...cards];
    if (sort.value === 'name') {
      sorted.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title, 'ru'));
    }
    if (sort.value === 'duration') {
      sorted.sort((a, b) => Number(a.dataset.minutes) - Number(b.dataset.minutes));
    }

    for (const card of sorted) {
      const game = card.dataset;
      const titleMatches = game.title.toLocaleLowerCase('ru').includes(query);
      const genreMatches = !genre || game.genre === genre;
      const playersMatch = !players || (players >= Number(game.min) && players <= Number(game.max));
      const durationMatches = !duration || Number(game.minutes) <= duration;
      const favoriteMatches = !values.has('favorites') || favorites.includes(game.game);
      card.hidden = !(titleMatches && genreMatches && playersMatch && durationMatches && favoriteMatches);
      catalog.append(card);
    }
    empty.hidden = cards.some(card => !card.hidden);
  }

  filters.addEventListener('input', update);
  filters.addEventListener('reset', () => requestAnimationFrame(update));
  sort.addEventListener('change', update);
}

function setupFavorite() {
  const button = document.querySelector('[data-favorite]');
  if (!button) return;
  const game = button.dataset.favorite;

  function update() {
    const selected = loadItems('mipl-favorites').includes(game);
    button.setAttribute('aria-pressed', String(selected));
    button.textContent = selected ? 'Убрать из избранного' : 'Добавить в избранное';
  }

  button.addEventListener('click', () => {
    const favorites = loadItems('mipl-favorites');
    const next = favorites.includes(game)
      ? favorites.filter(item => item !== game)
      : [...favorites, game];
    if (saveItems('mipl-favorites', next)) update();
  });
  update();
}

function setupEvents() {
  const buttons = [...document.querySelectorAll('[data-event-filter]')];
  const cards = document.querySelectorAll('[data-event-type]');
  const modal = document.querySelector('#event-modal');
  if (!modal) return;

  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const filter of buttons) {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      }
      for (const card of cards) {
        card.hidden = Boolean(button.dataset.eventFilter)
          && card.dataset.eventType !== button.dataset.eventFilter;
      }
    });
  }

  modal.addEventListener('show.bs.modal', event => {
    const name = event.relatedTarget?.dataset.eventName;
    const form = modal.querySelector('form');
    form.reset();
    form.elements.event.value = name || '';
    form.querySelector('[data-status]').textContent = '';
    modal.querySelector('.modal-title').textContent = name || 'Запись на событие';
  });

  modal.addEventListener('shown.bs.modal', () => {
    modal.querySelector('input[name="name"]').focus();
  });
}

function setupBooking() {
  const form = document.querySelector('[data-request="booking"]');
  if (!form) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  form.elements.date.min = `${year}-${month}-${day}`;
  form.elements.date.value = form.elements.date.min;

  const game = new URLSearchParams(location.search).get('game');
  if (Object.hasOwn(gameTitles, game)) form.elements.notes.value = gameTitles[game];

  const slots = [...document.querySelectorAll('[data-time]')];
  const timeField = form.elements.time;
  function updateSlots() {
    const requests = loadItems('mipl-requests');
    const date = form.elements.date.value;
    const zone = form.elements.zone.value;

    for (const slot of slots) {
      const time = slot.dataset.time;
      const count = remainingTables(requests, { date, zone, time });
      slot.disabled = count === 0;
      slot.querySelector('.booking-slot__count').textContent = tableCountLabel(count);
      const option = [...timeField.options].find(item => item.value === time);
      option.disabled = slot.disabled;
    }

    if (!timeField.value || timeField.selectedOptions[0]?.disabled) {
      timeField.value = slots.find(slot => !slot.disabled)?.dataset.time || '';
    }
    for (const slot of slots) {
      const selected = slot.dataset.time === timeField.value;
      slot.classList.toggle('booking-slot--selected', selected);
      slot.setAttribute('aria-pressed', String(selected));
    }
  }

  for (const slot of slots) {
    slot.addEventListener('click', () => {
      timeField.value = slot.dataset.time;
      updateSlots();
    });
  }
  timeField.addEventListener('change', updateSlots);
  form.elements.date.addEventListener('change', updateSlots);
  form.elements.zone.addEventListener('change', updateSlots);
  form.addEventListener('booking-saved', updateSlots);
  window.addEventListener('storage', event => {
    if (event.key === 'mipl-requests' || event.key === null) updateSlots();
  });
  updateSlots();
}

function setupRequests() {
  for (const form of document.querySelectorAll('[data-request]')) {
    const phone = form.elements.phone;
    phone.addEventListener('input', () => phone.setCustomValidity(''));

    form.addEventListener('submit', event => {
      event.preventDefault();
      const status = form.querySelector('[data-status]');
      const digits = phone.value.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        phone.setCustomValidity('Введите номер телефона с кодом города или страны.');
        phone.reportValidity();
        return;
      }
      const fields = Object.fromEntries(new FormData(form));
      const requests = loadItems('mipl-requests');
      const isBooking = form.dataset.request === 'booking';
      if (isBooking && (!fields.time || remainingTables(requests, fields) === 0)) {
        status.textContent = 'Выберите время, на которое есть свободный стол.';
        form.dispatchEvent(new Event('booking-saved'));
        return;
      }
      requests.push({ ...fields, type: form.dataset.request, createdAt: new Date().toISOString() });
      const saved = saveItems('mipl-requests', requests);
      status.textContent = saved ? 'Заявка сохранена на этом устройстве.' : 'Не удалось сохранить заявку.';
      if (saved && isBooking) form.dispatchEvent(new Event('booking-saved'));
    });
  }
}

function setupReviews() {
  const form = document.querySelector('[data-review-form]');
  if (!form) return;

  const list = document.querySelector('[data-review-list]');
  const empty = document.querySelector('[data-review-empty]');
  const status = form.querySelector('[data-status]');

  function renderReviews() {
    list.replaceChildren();
    const reviews = loadItems('mipl-reviews');
    empty.hidden = reviews.length > 0;
    for (const review of reviews) {
      const column = document.createElement('div');
      column.className = 'col';
      const article = document.createElement('article');
      article.className = 'review h-100';
      const title = document.createElement('h3');
      title.textContent = review.name;
      const stars = document.createElement('p');
      const score = Math.max(0, Math.min(5, Math.floor(Number(review.stars)) || 0));
      stars.className = 'review__stars mb-2';
      stars.textContent = '★'.repeat(score) + '☆'.repeat(5 - score);
      stars.setAttribute('aria-label', `Оценка ${score} из 5`);
      const text = document.createElement('p');
      text.className = 'mb-0';
      text.textContent = review.text;
      article.append(title, stars, text);
      column.append(article);
      list.append(column);
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(form);
    const name = fields.get('name').trim();
    const text = fields.get('text').trim();
    if (!name || !text) {
      status.textContent = 'Укажите имя и напишите отзыв.';
      return;
    }
    const reviews = loadItems('mipl-reviews');
    reviews.unshift({ name, text, stars: Number(fields.get('stars')) });
    if (!saveItems('mipl-reviews', reviews)) {
      status.textContent = 'Не удалось сохранить отзыв.';
      return;
    }
    form.reset();
    renderReviews();
    status.textContent = 'Отзыв сохранён на этом устройстве.';
  });
  renderReviews();
}

setupCatalog();
setupFavorite();
setupEvents();
setupBooking();
setupRequests();
setupReviews();
