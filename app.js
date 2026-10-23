/*
  Saffron & Stone restaurant demo
  1. Create a Supabase project.
  2. Paste your Project URL and anon/public key below.
  3. Run supabase_schema.sql in Supabase SQL Editor.
  Never put a Supabase service_role key in browser code.
*/
const SUPABASE_URL = "https://mhiquhyhckvozfiewhek.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MiCYOa31iyZbJrmgCMeQBQ_uhXcO6Oj";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
const supabaseClient = configured && window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (selector) => document.querySelector(selector);
const authModal = $("#auth-modal");
const authForm = $("#auth-form");
const authMessage = $("#auth-message");
const bookingMessage = $("#booking-message");
let authMode = "signin";
let currentUser = null;
let toastTimer;

$("#year").textContent = new Date().getFullYear();
const dateInput = document.querySelector('input[name="booking_date"]');
const today = new Date();
dateInput.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

function setMessage(el, text, type = "") {
  el.textContent = text;
  el.className = `form-message ${type}`.trim();
}
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function showAuth() {
  setMessage(authMessage, "");
  authModal.hidden = false;
  document.body.style.overflow = "hidden";
}
function hideAuth() {
  authModal.hidden = true;
  document.body.style.overflow = "";
}
function updateAuthUI(user) {
  currentUser = user || null;
  $("#auth-open").textContent = currentUser ? "Sign out" : "Sign in";
  $("#auth-open").title = currentUser ? currentUser.email : "Sign in";
  $("#auth-description").textContent = authMode === "signup"
    ? "Create an account to save and manage your reservations."
    : "Sign in to manage your reservations, or create an account.";
  $("#auth-title").innerHTML = authMode === "signup"
    ? "Join us at <em>the table.</em>"
    : "Good to have <em>you here.</em>";
  $("#auth-submit").innerHTML = authMode === "signup"
    ? 'Create account <span>↗</span>' : 'Sign in <span>↗</span>';
  $("#auth-switch-text").textContent = authMode === "signup" ? "Already have an account?" : "New here?";
  $("#auth-mode-toggle").textContent = authMode === "signup" ? "Sign in" : "Create an account";
  $("#my-bookings").querySelector(".account-heading h2").textContent =
    currentUser ? "Your reservations." : "Your reservations.";
  if (!currentUser) $("#bookings-list").innerHTML = '<p class="muted">Sign in to view your saved reservations.</p>';
  else loadBookings();
}
function configWarning() {
  if (!supabaseClient) {
    setMessage(bookingMessage, "Setup needed: add your Supabase Project URL and anon key in app.js, then run supabase_schema.sql.", "error");
    showAuth();
    setMessage(authMessage, "Connect your Supabase project first by updating the two configuration values in app.js.", "error");
    return true;
  }
  return false;
}

$("#auth-open").addEventListener("click", async () => {
  if (currentUser) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) toast(error.message);
    else { updateAuthUI(null); toast("You have signed out."); }
  } else {
    authMode = "signin";
    updateAuthUI(currentUser);
    showAuth();
  }
});
$("#auth-close").addEventListener("click", hideAuth);
authModal.addEventListener("click", (event) => { if (event.target === authModal) hideAuth(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !authModal.hidden) hideAuth(); });
$("#auth-mode-toggle").addEventListener("click", () => {
  authMode = authMode === "signin" ? "signup" : "signin";
  updateAuthUI(currentUser);
  setMessage(authMessage, "");
  authForm.elements.password.autocomplete = authMode === "signup" ? "new-password" : "current-password";
});
$("#menu-toggle").addEventListener("click", () => $("nav").classList.toggle("open"));
document.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => $("nav").classList.remove("open")));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (configWarning()) return;
  const email = authForm.elements.email.value.trim();
  const password = authForm.elements.password.value;
  const submit = $("#auth-submit");
  submit.disabled = true;
  setMessage(authMessage, authMode === "signup" ? "Creating your account…" : "Signing you in…");
  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        updateAuthUI(data.user);
        hideAuth();
        toast("Account created. Welcome!");
      } else {
        setMessage(authMessage, "Account created. Check your email to confirm your address, then sign in.", "success");
      }
    } else {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      updateAuthUI(data.user);
      hideAuth();
      toast("Welcome back!");
    }
  } catch (error) {
    setMessage(authMessage, error.message || "Authentication failed. Please try again.", "error");
  } finally {
    submit.disabled = false;
  }
});

$("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (configWarning()) return;
  if (!currentUser) {
    setMessage(bookingMessage, "Please sign in or create an account before requesting a reservation.", "error");
    authMode = "signin";
    updateAuthUI(currentUser);
    showAuth();
    return;
  }
  const form = event.currentTarget;
  const values = new FormData(form);
  const date = String(values.get("booking_date"));
  const time = String(values.get("booking_time"));
  if (!date || !time) {
    setMessage(bookingMessage, "Please choose a date and time.", "error");
    return;
  }
  const submit = $("#booking-submit");
  submit.disabled = true;
  submit.textContent = "Saving your request…";
  const booking = {
    user_id: currentUser.id,
    guest_name: String(values.get("guest_name")).trim(),
    guests: Number(values.get("guests")),
    booking_date: date,
    booking_time: time,
    notes: String(values.get("notes") || "").trim(),
    status: "requested"
  };
  try {
    const { error } = await supabaseClient.from("bookings").insert(booking);
    if (error) throw error;
    setMessage(bookingMessage, "Your reservation request is saved. We look forward to seeing you!", "success");
    form.reset();
    dateInput.min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    form.elements.guests.value = "2";
    await loadBookings();
  } catch (error) {
    setMessage(bookingMessage, error.message || "Could not save your booking. Please try again.", "error");
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Request a reservation <span>↗</span>';
  }
});

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}
async function loadBookings() {
  const list = $("#bookings-list");
  if (!supabaseClient || !currentUser) {
    list.innerHTML = '<p class="muted">Sign in to view your saved reservations.</p>';
    return;
  }
  list.innerHTML = '<p class="muted">Loading your reservations…</p>';
  const { data, error } = await supabaseClient
    .from("bookings")
    .select("id, guest_name, guests, booking_date, booking_time, notes, status, created_at")
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });
  if (error) {
    list.innerHTML = `<p class="form-message error">${escapeHTML(error.message)}. Check that you ran supabase_schema.sql.</p>`;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<p class="muted">No reservations yet. Your next good meal starts above.</p>';
    return;
  }
  list.innerHTML = data.map(item => {
    const date = new Date(`${item.booking_date}T00:00:00`);
    const formattedDate = Number.isNaN(date.getTime()) ? item.booking_date :
      date.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" });
    return `<article class="booking-item">
      <div><h3>${escapeHTML(item.guest_name)} · ${escapeHTML(item.guests)} ${Number(item.guests) === 1 ? "guest" : "guests"}</h3>
      <p>${escapeHTML(formattedDate)} at ${escapeHTML(item.booking_time)}${item.notes ? ` · ${escapeHTML(item.notes)}` : ""}</p>
      <p class="booking-status">${escapeHTML(item.status || "requested")}</p></div>
      <button class="cancel-button" data-cancel-id="${escapeHTML(item.id)}">Cancel request</button>
    </article>`;
  }).join("");
  list.querySelectorAll("[data-cancel-id]").forEach(button => button.addEventListener("click", () => cancelBooking(button.dataset.cancelId, button)));
}
async function cancelBooking(id, button) {
  if (!currentUser || !supabaseClient) return;
  if (!confirm("Cancel this reservation request?")) return;
  button.disabled = true;
  const { error } = await supabaseClient.from("bookings").delete().eq("id", id);
  if (error) {
    toast(error.message || "Could not cancel this reservation.");
    button.disabled = false;
  } else {
    toast("Reservation request cancelled.");
    await loadBookings();
  }
}
$("#refresh-bookings").addEventListener("click", loadBookings);

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) console.error(error);
    updateAuthUI(data?.session?.user || null);
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => updateAuthUI(session?.user || null));
} else {
  $("#bookings-list").innerHTML = '<p class="muted">Connect Supabase in app.js to enable accounts and reservations.</p>';
}
