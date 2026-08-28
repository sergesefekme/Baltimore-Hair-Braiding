/* ---------------------------------------------------------
   Mirabelle.B — appointments dashboard
   ---------------------------------------------------------
   Lives in public/ and is copied to the build verbatim, so it carries its own
   config rather than Vite's import.meta.env. That is why the two constants
   below are inline: they are the same publishable values that already ship in
   the site bundle, and both are public by design.

   The publishable key alone grants nothing here. Every read and write on this
   page goes out with the signed-in user's JWT, and the RLS policies check
   membership of public.admins. A stranger with this file and this key still
   sees nothing.

   No framework and no dependencies: raw fetch against PostgREST and the Auth
   REST API, matching how booking.js already talks to Supabase.
   --------------------------------------------------------- */

const SUPABASE_URL = "https://dqglhppksyhekaflnyop.supabase.co";
const ANON_KEY = "sb_publishable_d0bIGUmjtA0H_ETsjGtWaA_NkZM5Mqa";

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;
const SESSION_KEY = "mb_admin_session";

/* The database stores pending/confirmed/completed/cancelled/no_show. Those
   are column values, not words to show a person. Mirabelle reads this between
   clients; it should read like her diary, not like a schema. */
const STATUS_LABEL = {
  pending: "Appointment Pending",
  confirmed: "Appointment Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

let session = null;
let rows = [];

/* ---------------- session ---------------- */

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode: the page still works, it just will not remember */
  }
}

function authHeaders() {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${session?.access_token ?? ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function signIn(email, password) {
  const res = await fetch(`${AUTH}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || body.msg || "Sign-in failed");
  return body;
}

/** Access tokens are short-lived; without this the page dies after an hour. */
async function refresh() {
  if (!session?.refresh_token) return null;
  const res = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function signOut() {
  session = null;
  saveSession(null);
  rows = [];
  render();
}

/* ---------------- data ---------------- */

/** Wraps fetch so one expired token does not look like a permissions error. */
async function api(path, options = {}, retry = true) {
  const res = await fetch(`${REST}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401 && retry) {
    const fresh = await refresh();
    if (fresh) {
      session = fresh;
      saveSession(fresh);
      return api(path, options, false);
    }
    await signOut();
    throw new Error("Session expired — please sign in again.");
  }
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function loadBookings() {
  rows = await api(
    "/booking_requests?select=*&order=created_at.desc&limit=500"
  );
}

async function patch(id, body) {
  await api(`/booking_requests?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  await loadBookings();
  render();
}

/* ---------------- formatting ---------------- */

const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return String(iso || "—");
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString(
    "en-US",
    { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }
  );
};

const fmtTime = (t) => {
  const m = /^(\d{2}):(\d{2})/.exec(String(t || ""));
  if (!m) return "";
  let h = +m[1];
  const s = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${s}`;
};

const fmtMoney = (v) =>
  v == null ? "—" : `$${Number(v).toFixed(2).replace(/\.00$/, "")}`;

/** Today in local time as yyyy-mm-dd, to compare against date columns. */
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const slotOf = (r) => r.appointment_date || r.preferred_date;

/* ---------------- render ---------------- */

function statCard(label, value, tone) {
  const n = el("div", `stat${tone ? " stat--" + tone : ""}`);
  n.append(el("span", "stat__n", String(value)), el("span", "stat__l", label));
  return n;
}

function actionButton(label, cls, onClick) {
  const b = el("button", `btn ${cls}`, label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

function bookingCard(r, opts = {}) {
  const card = el("article", "card");

  const head = el("div", "card__head");
  head.append(el("span", "card__name", r.name));
  head.append(
    el("span", `pill pill--${r.status}`, STATUS_LABEL[r.status] ?? r.status)
  );
  card.append(head);

  const meta = el("div", "card__meta");
  const add = (label, value) => {
    if (!value) return;
    const row = el("p", "kv");
    row.append(el("span", "kv__k", label), el("span", "kv__v", value));
    meta.append(row);
  };
  add("Service", r.style);
  add("When", `${fmtDate(slotOf(r))}${r.appointment_time ? " · " + fmtTime(r.appointment_time) : r.preferred_time ? " · " + r.preferred_time : ""}`);
  add("Phone", r.phone);
  add("Email", r.email);
  add("Notes", r.notes);
  add("Price", r.quoted_price != null ? fmtMoney(r.quoted_price) : null);
  if (r.source) add("Source", r.source + (r.utm_campaign ? ` · ${r.utm_campaign}` : ""));
  card.append(meta);

  // Phone and email as real links: this page is used on a phone between
  // clients, and retyping a number from a screen is how numbers get misdialled.
  const contact = el("p", "card__contact");
  const tel = el("a", "btn btn--ghost", "Call");
  tel.href = `tel:${String(r.phone).replace(/[^\d+]/g, "")}`;
  contact.append(tel);
  const sms = el("a", "btn btn--ghost", "Text");
  sms.href = `sms:${String(r.phone).replace(/[^\d+]/g, "")}`;
  contact.append(sms);
  if (r.email) {
    const mail = el("a", "btn btn--ghost", "Email");
    mail.href = `mailto:${r.email}`;
    contact.append(mail);
  }
  card.append(contact);

  if (opts.confirmable) {
    const form = el("div", "confirm");
    form.append(el("p", "confirm__t", "Confirm this appointment"));

    const grid = el("div", "confirm__grid");
    const dateIn = el("input");
    dateIn.type = "date";
    dateIn.value = slotOf(r) || "";
    dateIn.setAttribute("aria-label", "Appointment date");

    const timeIn = el("input");
    timeIn.type = "time";
    timeIn.setAttribute("aria-label", "Appointment time");

    const priceIn = el("input");
    priceIn.type = "number";
    priceIn.min = "0";
    priceIn.step = "1";
    priceIn.placeholder = "Agreed price";
    priceIn.setAttribute("aria-label", "Agreed price");

    grid.append(dateIn, timeIn, priceIn);
    form.append(grid);

    form.append(
      actionButton("Confirm appointment", "btn--primary", async () => {
        if (!dateIn.value) {
          alert("Pick the appointment date first.");
          return;
        }
        await patch(r.id, {
          status: "confirmed",
          appointment_date: dateIn.value,
          appointment_time: timeIn.value || null,
          quoted_price: priceIn.value ? Number(priceIn.value) : null,
        });
      })
    );
    card.append(form);
  }

  /* Reschedule, for an appointment already confirmed. Collapsed by default:
     it is the least-used action on the card and would otherwise push Mark
     completed below the fold on a phone. Saving re-emails the client, because
     the trigger fires on a slot change as well as a status change - moving an
     appointment and telling nobody is how a client arrives on the wrong day. */
  if (r.status === "confirmed") {
    const box = el("details", "resched");
    box.append(el("summary", null, "Change date or time"));

    const grid = el("div", "confirm__grid");
    const d = el("input");
    d.type = "date";
    d.value = r.appointment_date || slotOf(r) || "";
    d.setAttribute("aria-label", "New appointment date");

    const t = el("input");
    t.type = "time";
    t.value = (r.appointment_time || "").slice(0, 5);
    t.setAttribute("aria-label", "New appointment time");

    grid.append(d, t);
    box.append(grid);
    box.append(
      actionButton("Save & email client", "btn--primary", async () => {
        if (!d.value) {
          alert("Pick a date first.");
          return;
        }
        await patch(r.id, {
          appointment_date: d.value,
          appointment_time: t.value || null,
        });
      })
    );
    card.append(box);
  }

  const acts = el("div", "card__acts");
  if (r.status === "confirmed") {
    acts.append(
      actionButton("Mark as completed", "btn--ok", () =>
        patch(r.id, { status: "completed" })
      ),
      actionButton("No-show", "btn--warn", () =>
        patch(r.id, { status: "no_show" })
      )
    );
  }
  if (r.status !== "cancelled" && r.status !== "completed") {
    acts.append(
      actionButton("Cancel", "btn--danger", () => {
        if (confirm(`Cancel ${r.name}'s appointment?`)) {
          patch(r.id, { status: "cancelled" });
        }
      })
    );
  }
  if (r.status === "cancelled" || r.status === "no_show") {
    acts.append(
      actionButton("Reopen", "btn--ghost", () =>
        patch(r.id, { status: "pending" })
      )
    );
  }
  if (acts.children.length) card.append(acts);

  return card;
}

function section(title, note, list, opts) {
  const s = el("section", "panel");
  s.append(el("h2", "panel__t", title));
  if (note) s.append(el("p", "panel__n", note));
  if (!list.length) {
    s.append(el("p", "empty", "Nothing here."));
  } else {
    const wrap = el("div", "cards");
    list.forEach((r) => wrap.append(bookingCard(r, opts)));
    s.append(wrap);
  }
  return s;
}

function render() {
  const root = $("#app");
  root.textContent = "";

  if (!session) {
    root.append(loginView());
    return;
  }

  const today = todayISO();
  const pending = rows.filter((r) => r.status === "pending");
  const todays = rows.filter(
    (r) => r.status === "confirmed" && slotOf(r) === today
  );
  const upcoming = rows
    .filter((r) => r.status === "confirmed" && slotOf(r) > today)
    .sort((a, b) => String(slotOf(a)).localeCompare(String(slotOf(b))));

  const bar = el("div", "bar");
  bar.append(
    el("span", "bar__who", session.user?.email || "Signed in"),
    actionButton("Sign out", "btn--ghost", signOut)
  );
  root.append(bar);

  const stats = el("div", "stats");
  stats.append(
    statCard("Awaiting reply", pending.length, pending.length ? "alert" : null),
    statCard("Today", todays.length),
    statCard("Upcoming", upcoming.length),
    statCard("Completed", rows.filter((r) => r.status === "completed").length, "ok"),
    statCard("Cancelled", rows.filter((r) => r.status === "cancelled").length),
    statCard("No-shows", rows.filter((r) => r.status === "no_show").length)
  );
  root.append(stats);

  root.append(
    section(
      "Awaiting your reply",
      "Requests nobody has answered yet. Confirming emails the client automatically.",
      pending,
      { confirmable: true }
    )
  );
  root.append(section("Today", null, todays));
  root.append(section("Upcoming", null, upcoming));

  /* Where the bookings came from. Counts every request ever received, which
     is the number that pairs with ad spend. */
  const bySource = {};
  rows.forEach((r) => {
    const k = r.source || "unknown";
    bySource[k] ??= { requests: 0, confirmed: 0, value: 0 };
    bySource[k].requests++;
    if (r.status === "confirmed" || r.status === "completed") {
      bySource[k].confirmed++;
      bySource[k].value += Number(r.quoted_price || 0);
    }
  });

  const lead = el("section", "panel");
  lead.append(el("h2", "panel__t", "Where bookings come from"));
  const entries = Object.entries(bySource).sort((a, b) => b[1].requests - a[1].requests);
  if (!entries.length) {
    lead.append(el("p", "empty", "No bookings yet."));
  } else {
    const t = el("table", "tbl");
    const thead = el("thead");
    const hr = el("tr");
    ["Source", "Requests", "Confirmed", "Booked value"].forEach((h) =>
      hr.append(el("th", null, h))
    );
    thead.append(hr);
    t.append(thead);
    const tb = el("tbody");
    entries.forEach(([k, v]) => {
      const tr = el("tr");
      tr.append(
        el("td", null, k),
        el("td", "num", String(v.requests)),
        el("td", "num", String(v.confirmed)),
        el("td", "num", v.value ? fmtMoney(v.value) : "—")
      );
      tb.append(tr);
    });
    t.append(tb);
    const scroll = el("div", "tbl-wrap");
    scroll.append(t);
    lead.append(scroll);
  }
  root.append(lead);
}

function loginView() {
  const wrap = el("div", "login");
  wrap.append(el("h1", "login__t", "Appointments"));
  wrap.append(
    el("p", "login__n", "Sign in to manage bookings for Mirabelle.B.")
  );

  const form = el("form", "login__form");
  const email = el("input");
  email.type = "email";
  email.placeholder = "Email";
  email.autocomplete = "username";
  email.required = true;
  email.setAttribute("aria-label", "Email");

  const pass = el("input");
  pass.type = "password";
  pass.placeholder = "Password";
  pass.autocomplete = "current-password";
  pass.required = true;
  pass.setAttribute("aria-label", "Password");

  const btn = el("button", "btn btn--primary", "Sign in");
  btn.type = "submit";

  const err = el("p", "login__err");
  err.setAttribute("role", "alert");

  form.append(email, pass, btn, err);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Signing in…";
    try {
      session = await signIn(email.value.trim(), pass.value);
      saveSession(session);
      await loadBookings();
      render();
    } catch (ex) {
      err.textContent = String(ex.message || ex);
      btn.disabled = false;
      btn.textContent = "Sign in";
    }
  });

  wrap.append(form);
  return wrap;
}

/* ---------------- boot ---------------- */

(async function start() {
  session = loadSession();
  if (session) {
    try {
      await loadBookings();
    } catch {
      // Stored token is stale or the account lost access; fall back to login
      // rather than leaving an empty dashboard that looks like "no bookings".
      session = null;
      saveSession(null);
    }
  }
  render();
})();
