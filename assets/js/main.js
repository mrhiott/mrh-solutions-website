/* MRH Solutions: site behavior
 * - Header shadow once the page scrolls
 * - Mobile navigation menu
 * - Active-section highlight in the nav
 * - Reveal-on-scroll (skipped when the visitor prefers reduced motion)
 * - Contact form: validation plus submission (mailto fallback or form endpoint)
 */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Header state ---------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* Mobile navigation ----------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && nav) {
    var toggleLabel = toggle.querySelector('.sr-only');

    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      if (toggleLabel) toggleLabel.textContent = open ? 'Close menu' : 'Open menu';
    };

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a link, on Escape, on outside click, and when resizing to desktop.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (nav.classList.contains('is-open') && !event.target.closest('.site-header')) setMenu(false);
    });
    var desktop = window.matchMedia('(min-width: 861px)');
    var onBreakpoint = function (event) { if (event.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  /* Active section in nav ------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav ul a[href^="#"]'));
  var sections = document.querySelectorAll('main section[id]');

  if (navLinks.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Array.prototype.forEach.call(sections, function (section) { sectionObserver.observe(section); });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll('.reveal');

  if (!prefersReducedMotion && 'IntersectionObserver' in window && revealItems.length) {
    root.classList.add('can-reveal');
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealItems, function (item) { revealObserver.observe(item); });

    // Make sure nothing stays hidden before printing.
    window.addEventListener('beforeprint', function () {
      Array.prototype.forEach.call(revealItems, function (item) { item.classList.add('is-visible'); });
    });
  }

  /* Footer year ----------------------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Contact form ---------------------------------------------------------- */
  var form = document.getElementById('contact-form');
  if (!form) return;

  form.noValidate = true; // we show our own inline messages instead of browser bubbles

  var contactEmail = form.getAttribute('data-contact-email') || 'matt@mrhsolutions.co';
  var statusEl = form.querySelector('.form-status');
  var submitBtn = form.querySelector('[type="submit"]');
  var fields = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required]'));

  var errorFor = function (field) {
    var v = field.validity;
    var value = field.value.trim();
    if (v.valueMissing || value === '') {
      if (field.name === 'name') return 'Please enter your name.';
      if (field.name === 'email') return 'Please enter your email address.';
      return 'Please include a short message.';
    }
    if (field.name === 'email' && (v.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return 'Please enter a valid email address, like name@example.com.';
    }
    if (v.tooLong) return 'This field is too long.';
    return '';
  };

  var showError = function (field, message) {
    var errorEl = document.getElementById(field.id + '-error');
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = !message;
    }
  };

  fields.forEach(function (field) {
    field.addEventListener('blur', function () {
      if (field.value.trim()) showError(field, errorFor(field));
    });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true') showError(field, errorFor(field));
    });
  });

  // Status message with an optional email link appended (built with DOM nodes, not HTML strings).
  var setStatus = function (state, message, withEmailLink) {
    statusEl.textContent = message;
    if (withEmailLink) {
      var link = document.createElement('a');
      link.href = 'mailto:' + contactEmail;
      link.textContent = contactEmail;
      statusEl.appendChild(document.createTextNode(' '));
      statusEl.appendChild(link);
      statusEl.appendChild(document.createTextNode('.'));
    }
    if (state) statusEl.setAttribute('data-state', state);
    else statusEl.removeAttribute('data-state');
  };

  var setBusy = function (busy) {
    if (!submitBtn) return;
    if (busy) {
      submitBtn.setAttribute('data-label', submitBtn.textContent);
      submitBtn.textContent = 'Sending…';
    } else if (submitBtn.hasAttribute('data-label')) {
      submitBtn.textContent = submitBtn.getAttribute('data-label');
    }
    submitBtn.disabled = busy;
    form.setAttribute('aria-busy', String(busy));
  };

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var firstInvalid = null;
    fields.forEach(function (field) {
      var message = errorFor(field);
      showError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      setStatus('error', 'Please check the highlighted fields.');
      firstInvalid.focus();
      return;
    }

    var data = new FormData(form);

    // Honeypot filled in: almost certainly a bot. Pretend success and stop.
    if (data.get('_gotcha')) {
      form.reset();
      setStatus('success', 'Thanks, your message has been sent.');
      return;
    }

    var name = String(data.get('name') || '').trim();
    var email = String(data.get('email') || '').trim();
    var message = String(data.get('message') || '').trim();
    var action = form.getAttribute('action') || '';

    // Default: no backend configured, so hand off to the visitor's email app.
    if (action.indexOf('mailto:') === 0) {
      var to = action.slice('mailto:'.length).split('?')[0] || contactEmail;
      var subject = 'Website inquiry from ' + name;
      var body = message + '\n\n--\n' + name + '\n' + email;
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      setStatus('info', 'Your email app should open with your message ready to send. If it doesn’t, you can write to', true);
      return;
    }

    // A form endpoint is configured (e.g. Formspree): submit in the background.
    data.append('_subject', 'New inquiry from ' + name + ' via mrhsolutions.co');
    data.append('_replyto', email);

    setBusy(true);
    setStatus('', '');

    fetch(action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Request failed with status ' + response.status);
        form.reset();
        fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
        setStatus('success', 'Thanks, ' + name.split(' ')[0] + '. Your message is on its way, and I’ll be in touch by email soon.');
      })
      .catch(function () {
        setStatus('error', 'Sorry, something went wrong sending your message. Please try again or email', true);
      })
      .then(function () { setBusy(false); });
  });
})();
