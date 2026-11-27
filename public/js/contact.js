// Contact form: sends through Web3Forms; if that fails, opens the visitor's mail app pre-filled.
const WEB3FORMS_KEY = 'e157f175-3a00-429c-98a8-5f525134f5ac'; // public client key, same as the old servepointpos form
const TO_EMAIL = 'digiforcebusiness@gmail.com';

const form = document.querySelector('[data-contact]');
const status = form?.querySelector('[data-form-status]');
const say = (kind, text) => { status.className = `form-status ${kind}`; status.textContent = text; };

function openMailto(d) {
  const subject = encodeURIComponent(`[SuperRev] ${d.subject}`);
  const body = encodeURIComponent(`From: ${d.name} <${d.email}>\n\n${d.message}`);
  location.href = `mailto:${TO_EMAIL}?subject=${subject}&body=${body}`;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const d = Object.fromEntries(['name', 'email', 'subject', 'message'].map((k) => [k, form[k].value.trim()]));
  if (form.botcheck.checked) return; // honeypot: bots tick hidden boxes
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  say('pending', 'Sending…');
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY, ...d, subject: `[SuperRev] ${d.subject}`,
        from_name: 'SuperRev website contact form', replyto: d.email,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
    form.reset();
    say('ok', "Thanks! Your message is on its way. We'll reply within 7 business days.");
  } catch {
    say('error', "Couldn't send from the page, so we're opening your email app instead.");
    openMailto(d);
  } finally {
    btn.disabled = false;
  }
});
