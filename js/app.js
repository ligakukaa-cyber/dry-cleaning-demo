/* ЛЕН — калькулятор заказа (химчистка + стирка по весу), вызов курьера. */
(() => {
  /* ---------- шапка и появление ---------- */
  const nav = document.getElementById("nav");
  const fab = document.querySelector(".call-fab");
  const calcSec = document.getElementById("calc");
  const onScroll = () => {
    nav.classList.toggle("stuck", window.scrollY > 30);
    if (fab && calcSec) {
      const r = calcSec.getBoundingClientRect();
      fab.classList.toggle("hide", window.scrollY < 400 || (r.top < window.innerHeight && r.bottom > 0));
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const io = new IntersectionObserver((items) => {
    items.forEach((it) => { if (it.isIntersecting) { it.target.classList.add("in"); io.unobserve(it.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  const rub = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const ITEMS = window.LEN_ITEMS, WASH = window.LEN_WASH, TERMS = window.LEN_TERMS, COURIER = window.LEN_COURIER;
  // пуховикам нужна долгая сушка — срочно их не берем (см. FAQ)
  const NO_URGENT = new Set(["down"]);

  /* ---------- вкладки ---------- */
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
      document.getElementById(`panel-${t.dataset.tab}`).hidden = !on;
    });
  }));

  /* ---------- список вещей со счетчиками ---------- */
  const qty = Object.fromEntries(ITEMS.map((i) => [i.id, 0]));
  const itemsEl = document.getElementById("items");
  if (itemsEl) {
    const groups = [...new Set(ITEMS.map((i) => i.group))];
    itemsEl.innerHTML = groups.map((g) => `
      <div class="group"><p class="group-name">${g}</p>
        ${ITEMS.filter((i) => i.group === g).map((i) => `
          <div class="item" data-id="${i.id}">
            <span class="item-name">${i.name}</span>
            <span class="item-price">${rub(i.price)}</span>
            <span class="counter">
              <button type="button" class="minus" aria-label="Убрать: ${i.name}">−</button>
              <output>0</output>
              <button type="button" class="plus" aria-label="Добавить: ${i.name}">+</button>
            </span>
          </div>`).join("")}
      </div>`).join("");

    itemsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const row = btn.closest(".item");
      const id = row.dataset.id;
      qty[id] = Math.max(0, Math.min(20, qty[id] + (btn.classList.contains("plus") ? 1 : -1)));
      row.querySelector("output").textContent = qty[id];
      row.classList.toggle("picked", qty[id] > 0);
      update();
    });
  }

  /* ---------- стирка по весу ---------- */
  const kg = document.getElementById("kg");
  const iron = document.getElementById("iron");
  const urgent = document.getElementById("urgent");
  const ironPrice = document.getElementById("ironPrice");
  if (ironPrice) ironPrice.textContent = WASH.iron_per_kg;
  if (kg) { kg.max = WASH.max_kg; kg.addEventListener("input", () => update()); }
  iron?.addEventListener("change", () => update());
  urgent?.addEventListener("change", () => update());

  /* ---------- расчет ---------- */
  const readyDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  };

  // вынесено отдельно и без DOM — так это проверяет тест
  const calc = (q, kgValue, withIron, isUrgent) => {
    const lines = [];
    let sum = 0;
    // заказ возвращают целиком: если хоть одну вещь нельзя срочно — весь заказ
    // в обычный срок и без наценки (платить за срочность, не получив ее, нечестно)
    const slow = isUrgent && ITEMS.some((i) => q[i.id] && NO_URGENT.has(i.id));
    const k = isUrgent && !slow ? 1 + TERMS.surcharge : 1;
    ITEMS.forEach((i) => {
      if (!q[i.id]) return;
      const cost = i.price * q[i.id] * k;
      lines.push([`${i.name} × ${q[i.id]}`, cost]);
      sum += cost;
    });
    if (kgValue > 0) {
      const billed = Math.max(kgValue, WASH.min_kg);
      const per = WASH.per_kg + (withIron ? WASH.iron_per_kg : 0);
      const cost = billed * per * k;
      lines.push([`Стирка ${billed} кг${withIron ? " + глажка" : ""}`, cost]);
      sum += cost;
    }
    const courier = sum === 0 ? 0 : sum >= COURIER.free_from ? 0 : COURIER.price;
    const days = k > 1 ? TERMS.urgent_days : TERMS.normal_days;
    return { lines, sum, courier, total: sum + courier, days, slow };
  };
  window.LEN_CALC = calc;

  function update() {
    const kgValue = kg ? Number(kg.value) : 0;
    document.getElementById("kgOut").textContent = kgValue ? `${kgValue} кг` : "не нужно";
    document.getElementById("kgHint").textContent = kgValue && kgValue < WASH.min_kg
      ? `Минимальный заказ стирки — ${WASH.min_kg} кг, посчитаем как ${WASH.min_kg}.`
      : "Обычная загрузка машины — 5 кг. Минимальный заказ стирки — 3 кг.";

    const r = calc(qty, kgValue, iron?.checked, urgent?.checked);
    document.getElementById("sumLines").innerHTML = r.lines.length
      ? r.lines.map(([t, c]) => `<li><span>${t}</span><b>${rub(c)}</b></li>`).join("")
      : '<li class="empty">Пока ничего не добавлено</li>';
    document.getElementById("sumCourier").textContent = !r.sum ? "—" : r.courier ? rub(r.courier) : "бесплатно";
    document.getElementById("sumReady").textContent = r.sum ? readyDate(r.days) : "—";
    document.getElementById("sumTotal").textContent = rub(r.total);

    let hint = "";
    if (r.slow) hint = "Пуховики срочно не чистим — им нужна долгая сушка, поэтому весь заказ будет готов в обычный срок и без наценки.";
    else if (r.sum && r.courier) hint = `Добавьте вещей еще на ${rub(COURIER.free_from - r.sum)} — курьер станет бесплатным.`;
    document.getElementById("sumHint").textContent = hint;
  }
  if (itemsEl) update();

  document.getElementById("toForm")?.addEventListener("click", () => {
    const note = document.getElementById("note");
    const lines = [...document.querySelectorAll("#sumLines li:not(.empty) span")].map((s) => s.textContent);
    if (lines.length) {
      note.value = `${lines.join(", ")}${urgent.checked ? ", срочно" : ""}. ` +
        `По калькулятору ${document.getElementById("sumTotal").textContent}.`;
    }
  });

  /* ---------- заявка ---------- */
  const day = document.getElementById("day");
  if (day) {
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const label = i === 0 ? "Сегодня" : i === 1 ? "Завтра"
        : d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
      day.add(new Option(label, d.toISOString().slice(0, 10)));
    }
  }

  const form = document.getElementById("leadForm");
  if (form) {
    const ok = document.getElementById("ok");
    const bad = (input, text) => {
      const field = input.closest(".field, .check");
      field.classList.add("bad");
      if (text && !field.querySelector(".err")) {
        const p = document.createElement("p");
        p.className = "err";
        p.textContent = text;
        field.appendChild(p);
      }
    };
    const clean = (input) => {
      const field = input.closest(".field, .check");
      field.classList.remove("bad");
      field.querySelector(".err")?.remove();
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name");
      const phone = document.getElementById("phone");
      const address = document.getElementById("address");
      const agree = document.getElementById("agree");
      [name, phone, address, agree].forEach(clean);

      let valid = true;
      if (name.value.trim().length < 2) { bad(name, "Как к вам обращаться?"); valid = false; }
      if (phone.value.replace(/\D/g, "").length < 10) { bad(phone, "Проверьте номер"); valid = false; }
      if (address.value.trim().length < 5) { bad(address, "Куда приехать курьеру?"); valid = false; }
      if (!agree.checked) { bad(agree); valid = false; }
      if (!valid) return;

      const slot = document.getElementById("slot").value;
      ok.textContent = `Готово! Курьер приедет ${day.options[day.selectedIndex].text.toLowerCase()} ${slot}. Позвоним, чтобы подтвердить.`;
      ok.hidden = false;
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      setTimeout(() => { form.reset(); ok.hidden = true; btn.disabled = false; }, 7000);
    });

    document.getElementById("phone")?.addEventListener("input", (e) => {
      const d = e.target.value.replace(/\D/g, "").slice(0, 11);
      if (!d) { e.target.value = ""; return; }
      const body = d.length === 11 ? d.slice(1) : d;
      const parts = [body.slice(0, 3), body.slice(3, 6), body.slice(6, 8), body.slice(8, 10)];
      e.target.value = "+7 " + parts[0] + (parts[1] ? " " + parts[1] : "") +
        (parts[2] ? "-" + parts[2] : "") + (parts[3] ? "-" + parts[3] : "");
    });
  }
})();
