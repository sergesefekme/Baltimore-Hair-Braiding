/* ---------------------------------------------------------
   Booking request form
   ---------------------------------------------------------
   The site is a static build, so there is no server of our own
   to post to. Requests go straight to Supabase's REST endpoint
   with the publishable (anon) key. That key is public by
   design — it is safe in the bundle only because the table's
   RLS policy grants anon INSERT and nothing else, so a reader
   of the bundle can file a request and cannot read anyone
   else's. If that policy is ever loosened, this becomes a
   data leak: see supabase/booking_requests.sql.

   Validation is done here rather than left to the browser
   because native bubbles cannot be styled and read as broken
   next to the rest of the page.
   --------------------------------------------------------- */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = "booking_requests";
const SALON_TEL = "+15714260602";
const SALON_TEL_HUMAN = "571-426-0602";

const PHONE_DIGITS = /\d/g;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Today as yyyy-mm-dd in the visitor's own timezone (not UTC — a booking
 *  made at 9pm Baltimore time must not offer "yesterday" as valid). */
function todayLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function setError(field, message) {
  const wrap = field.closest(".field");
  const slot = wrap?.querySelector(".field__err");
  wrap?.classList.toggle("is-bad", Boolean(message));
  field.setAttribute("aria-invalid", message ? "true" : "false");
  if (slot) slot.textContent = message || "";
}

function validate(form) {
  const f = (name) => form.elements[name];
  const problems = [];

  const check = (el, message) => {
    setError(el, message);
    if (message) problems.push(el);
  };

  const name = f("name");
  check(name, name.value.trim().length < 2 ? "Please tell us your name." : "");

  const phone = f("phone");
  const digits = (phone.value.match(PHONE_DIGITS) || []).length;
  check(
    phone,
    digits < 10 ? "We need a full mobile number to confirm your slot." : ""
  );

  const email = f("email");
  check(
    email,
    email.value.trim() && !EMAIL.test(email.value.trim())
      ? "That email does not look right."
      : ""
  );

  const style = f("style");
  check(style, style.value ? "" : "Pick a style, or choose “Not sure yet”.");

  const date = f("preferred_date");
  check(
    date,
    !date.value
      ? "Choose a date you would like."
      : date.value < todayLocal()
        ? "That date has passed. Pick a later one."
        : ""
  );

  return problems;
}

/** Composes the request as a text message to the salon. This is the path when
 *  no backend is configured — it keeps the form genuinely useful rather than
 *  collecting details and dropping them. On a phone the messaging app opens
 *  pre-filled; on a desktop nothing may happen, which is why the status line
 *  also prints the number and the message. */
function textFallback(p) {
  const lines = [
    "Booking request",
    `Name: ${p.name}`,
    `Phone: ${p.phone}`,
    p.email ? `Email: ${p.email}` : null,
    `Style: ${p.style}`,
    `Preferred: ${p.preferred_date} (${p.preferred_time || "any time"})`,
    p.notes ? `Notes: ${p.notes}` : null,
  ].filter(Boolean);

  const body = lines.join("\n");
  window.location.href = `sms:${SALON_TEL}?body=${encodeURIComponent(body)}`;
  return body;
}

async function send(payload) {
  if (!URL_BASE || !ANON_KEY) {
    return { mode: "text", body: textFallback(payload) };
  }

  const res = await fetch(`${URL_BASE}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Supabase responded ${res.status}: ${await res.text()}`);
  }

  return { mode: "stored" };
}

export function setupBooking() {
  const form = document.querySelector("#booking-form");
  if (!form) return;

  const status = form.querySelector(".booking__status");
  const button = form.querySelector('button[type="submit"]');
  const date = form.elements["preferred_date"];

  // Stops the picker offering dates that validate() would only reject.
  if (date) date.min = todayLocal();

  // Clear a field's error as soon as the visitor starts fixing it.
  form.addEventListener("input", (e) => {
    if (e.target.closest(".field.is-bad")) setError(e.target, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const problems = validate(form);
    if (problems.length) {
      status.dataset.state = "err";
      status.textContent = `Please check ${problems.length} field${problems.length > 1 ? "s" : ""} above.`;
      problems[0].focus();
      return;
    }

    // Honeypot: a real visitor never sees this field, so anything in it is a
    // bot. Answer as if it succeeded rather than telling them they were caught.
    if (form.elements["company"]?.value) {
      form.classList.add("is-sent");
      status.dataset.state = "ok";
      status.textContent = "Thank you — your request is in.";
      return;
    }

    button.setAttribute("aria-busy", "true");
    button.textContent = button.dataset.busy;
    status.dataset.state = "";
    status.textContent = "";

    const get = (n) => form.elements[n]?.value.trim() || null;

    try {
      const result = await send({
        name: get("name"),
        phone: get("phone"),
        email: get("email"),
        style: get("style"),
        preferred_date: get("preferred_date"),
        preferred_time: get("preferred_time"),
        notes: get("notes"),
      });

      form.classList.add("is-sent");
      status.dataset.state = "ok";
      status.textContent =
        result.mode === "stored"
          ? "Thank you — your request is in. We will text you to confirm the time, usually the same day."
          : `Your message app should be opening with the details ready to send to ${SALON_TEL_HUMAN}. If nothing opened, call or text that number.`;
    } catch (err) {
      console.error("[booking]", err);
      status.dataset.state = "err";
      status.textContent =
        "Sorry — that did not send. Please call or text 571-426-0602 and we will book you in.";
      button.removeAttribute("aria-busy");
      button.textContent = button.dataset.idle;
    }
  });
}
