/* Прайс химчистки ЛЕН. Правится здесь — верстку трогать не нужно. Цены в рублях за штуку. */
window.LEN_ITEMS = [
  { id: "shirt",   group: "Одежда",         name: "Рубашка, блузка",        price: 290 },
  { id: "trousers",group: "Одежда",         name: "Брюки, юбка",            price: 450 },
  { id: "dress",   group: "Одежда",         name: "Платье",                 price: 890 },
  { id: "suit",    group: "Одежда",         name: "Костюм-двойка",          price: 1190 },
  { id: "sweater", group: "Одежда",         name: "Свитер, кардиган",       price: 590 },
  { id: "coat",    group: "Верхняя одежда", name: "Пальто",                 price: 1390 },
  { id: "down",    group: "Верхняя одежда", name: "Пуховик",                price: 1590 },
  { id: "jacket",  group: "Верхняя одежда", name: "Куртка демисезонная",    price: 990 },
  { id: "sneakers",group: "Обувь",          name: "Кроссовки",              price: 1490 },
  { id: "boots",   group: "Обувь",          name: "Сапоги, ботинки",        price: 1790 },
  { id: "duvet",   group: "Для дома",       name: "Одеяло",                 price: 1490 },
  { id: "pillow",  group: "Для дома",       name: "Подушка",                price: 690 },
  { id: "curtain", group: "Для дома",       name: "Шторы (за полотно)",     price: 990 },
];

window.LEN_WASH = { per_kg: 220, iron_per_kg: 120, min_kg: 3, max_kg: 15 };

/* обычный срок и срочный; срочный дороже на surcharge (доля) */
window.LEN_TERMS = { normal_days: 3, urgent_days: 1, surcharge: 0.5 };

window.LEN_COURIER = { price: 300, free_from: 2000 };
