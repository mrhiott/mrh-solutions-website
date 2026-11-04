/* MRH Solutions: site behavior
 * - Header: compact state and reading-progress bar
 * - Full-screen menu on small screens
 * - Active-section highlight in the nav
 * - Scroll reveals (staggered automatically) and the Approach timeline
 * - Pointer micro-interactions: hero depth, CTA spotlight
 * - Copy-to-clipboard for the email address
 * - Contact form: validation, auto-growing message field, and submission
 *   (posts to the Formspree endpoint in the form's action; a mailto: action also works)
 *
 * Everything here is progressive enhancement: the page is complete without it.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* Header state + reading progress -------------------------------------- */
  var header = document.querySelector('[data-header]');
  var progressBar = document.querySelector('.scroll-progress span');
  var scrollQueued = false;

  var updateScroll = function () {
    scrollQueued = false;
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (progressBar) {
      var max = root.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    }
  };
  var onScroll = function () {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  };
  updateScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* Full-screen menu ------------------------------------------------------ */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var menuOpen = false;

  if (toggle && menu) {
    var toggleLabel = toggle.querySelector('.menu-toggle-label');
    var outside = [document.getElementById('main'), document.querySelector('.site-footer')];

    var setMenu = function (open, restoreFocus) {
      if (open === menuOpen) return;
      menuOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      if (toggleLabel) toggleLabel.textContent = open ? 'Close' : 'Menu';
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      // Keep keyboard and screen reader focus inside the menu while it is open.
      outside.forEach(function (el) { if (el) el.inert = open; });

      if (open) {
        var firstLink = menu.querySelector('a');
        if (firstLink) window.setTimeout(function () { firstLink.focus({ preventScroll: true }); }, 60);
      } else if (restoreFocus !== false) {
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener('click', function () { setMenu(!menuOpen); });

    // Choosing a link closes the menu; the browser then scrolls to the section.
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuOpen) setMenu(false);
    });

    var desktop = window.matchMedia('(min-width: 1024px)');
    var onBreakpoint = function (event) { if (event.matches) setMenu(false, false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  /* Active section in the nav -------------------------------------------- */
  var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

  if (navLinks.length && 'IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        each(navLinks, function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    each(document.querySelectorAll('main section[id]'), function (section) {
      sectionObserver.observe(section);
    });
  }

  /* Scroll reveals --------------------------------------------------------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('can-reveal');

    var revealObserver = new IntersectionObserver(function (entries) {
      // Items that enter together are staggered in document order.
      var entering = entries.filter(function (entry) { return entry.isIntersecting; });
      entering.forEach(function (entry, index) {
        var el = entry.target;
        revealObserver.unobserve(el);
        el.style.setProperty('--reveal-delay', Math.min(index * 0.09, 0.45) + 's');
        el.classList.add('is-visible');

        // Once revealed, hand the element back to its own transitions (hover states etc.).
        var done = function (event) {
          if (event.target !== el || event.propertyName !== 'transform') return;
          el.removeEventListener('transitionend', done);
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--reveal-delay');
        };
        el.addEventListener('transitionend', done);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

    each(document.querySelectorAll('.reveal'), function (el) { revealObserver.observe(el); });

    // Elements that only need to know when they are on screen (the Approach timeline).
    var observeOnce = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observeOnce.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -20% 0px' });

    each(document.querySelectorAll('[data-observe]'), function (el) { observeOnce.observe(el); });

    // Never leave content hidden in print.
    window.addEventListener('beforeprint', function () {
      each(document.querySelectorAll('.reveal, [data-observe]'), function (el) { el.classList.add('is-visible'); });
    });
  }

  /* Pointer micro-interactions (mouse and trackpad only) ------------------ */
  if (finePointer && !reduceMotion) {
    // Hero illustration: layers drift slightly with the pointer for a sense of depth.
    var panel = document.querySelector('[data-parallax]');
    var hero = panel && panel.closest('.hero');
    if (panel && hero) {
      var layers = panel.querySelectorAll('[data-depth]');
      var px = 0;
      var py = 0;
      var parallaxQueued = false;
      var applyParallax = function () {
        parallaxQueued = false;
        each(layers, function (layer) {
          var depth = parseFloat(layer.getAttribute('data-depth')) || 1;
          layer.style.translate = (px * depth * -10).toFixed(2) + 'px ' + (py * depth * -8).toFixed(2) + 'px';
        });
      };
      var queueParallax = function () {
        if (!parallaxQueued) {
          parallaxQueued = true;
          window.requestAnimationFrame(applyParallax);
        }
      };
      hero.addEventListener('pointermove', function (event) {
        var rect = hero.getBoundingClientRect();
        px = (event.clientX - rect.left) / rect.width - 0.5;
        py = (event.clientY - rect.top) / rect.height - 0.5;
        queueParallax();
      });
      hero.addEventListener('pointerleave', function () { px = 0; py = 0; queueParallax(); });
    }

    // Call-to-action panel: a soft copper spotlight follows the pointer.
    var spotlight = document.querySelector('[data-spotlight]');
    if (spotlight) {
      spotlight.addEventListener('pointermove', function (event) {
        var rect = spotlight.getBoundingClientRect();
        spotlight.style.setProperty('--spot-x', Math.round(event.clientX - rect.left) + 'px');
        spotlight.style.setProperty('--spot-y', Math.round(event.clientY - rect.top) + 'px');
      });
      spotlight.addEventListener('pointerleave', function () {
        spotlight.style.removeProperty('--spot-x');
        spotlight.style.removeProperty('--spot-y');
      });
    }
  }

  /* Copy email address ---------------------------------------------------- */
  var copyBtn = document.querySelector('[data-copy]');
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    var copyLabel = copyBtn.querySelector('.copy-btn-label');
    var copyIcon = copyBtn.querySelector('use');
    var copyStatus = document.querySelector('[data-copy-status]');
    var copyTimer = null;

    copyBtn.hidden = false;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
        copyBtn.classList.add('is-copied');
        if (copyLabel) copyLabel.textContent = 'Copied';
        if (copyIcon) copyIcon.setAttribute('href', '#i-check');
        if (copyStatus) copyStatus.textContent = 'Email address copied';
        window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          if (copyLabel) copyLabel.textContent = 'Copy';
          if (copyIcon) copyIcon.setAttribute('href', '#i-copy');
          if (copyStatus) copyStatus.textContent = '';
        }, 2200);
      }).catch(function () { /* the mailto link remains the fallback */ });
    });
  }

  /* Footer year ----------------------------------------------------------- */
  each(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Contact form ---------------------------------------------------------- */
  var form = document.getElementById('contact-form');
  if (!form) return;

  form.noValidate = true; // inline messages instead of browser bubbles

  var contactEmail = form.getAttribute('data-contact-email') || 'matt@mrhsolutions.co';
  var statusEl = form.querySelector('.form-status');
  var submitBtn = form.querySelector('[type="submit"]');
  var submitLabel = submitBtn ? submitBtn.querySelector('.btn-label') : null;
  var success = form.parentNode.querySelector('.form-success');
  var successText = success ? success.querySelector('[data-success-text]') : null;
  var resetBtn = success ? success.querySelector('[data-form-reset]') : null;
  var messageField = form.querySelector('textarea');
  var requiredFields = Array.prototype.slice.call(form.querySelectorAll('input[required], textarea[required]'));

  // Message field grows with its content.
  var maxMessageHeight = 420;
  var autoGrow = function () {
    if (!messageField) return;
    messageField.style.height = 'auto';
    var next = messageField.scrollHeight + 1;
    messageField.style.height = Math.min(next, maxMessageHeight) + 'px';
    messageField.style.overflowY = next > maxMessageHeight ? 'auto' : 'hidden';
  };
  if (messageField) {
    messageField.classList.add('autogrow');
    messageField.addEventListener('input', autoGrow);
  }

  var errorFor = function (field) {
    var value = field.value.trim();
    if (field.validity.valueMissing || value === '') {
      if (field.name === 'name') return 'Please enter your name.';
      if (field.name === 'email') return 'Please enter your email address.';
      return 'Please include a short message.';
    }
    if (field.name === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return 'Please enter a valid email address, like name@example.com.';
    }
    if (field.validity.tooLong) return 'This field is too long.';
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

  var clearError = function (field) {
    field.removeAttribute('aria-invalid');
    var errorEl = document.getElementById(field.id + '-error');
    if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
  };

  requiredFields.forEach(function (field) {
    field.addEventListener('blur', function () {
      if (field.value.trim()) showError(field, errorFor(field));
    });
    field.addEventListener('input', function () {
      if (field.getAttribute('aria-invalid') === 'true') showError(field, errorFor(field));
    });
  });

  // Status line, with an optional email link built from DOM nodes (never from HTML strings).
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
    submitBtn.disabled = busy;
    if (submitLabel) submitLabel.textContent = busy ? 'Sending…' : 'Send message';
    form.setAttribute('aria-busy', String(busy));
  };

  var showSuccess = function (name) {
    if (!success) {
      setStatus('info', 'Thanks, your message is on its way.');
      return;
    }
    var firstName = name ? name.split(/\s+/)[0] : '';
    if (successText) {
      successText.textContent = (firstName ? 'Thanks, ' + firstName + '.' : 'Thanks.') +
        ' Your message is on its way, and I’ll be in touch by email soon.';
    }
    form.hidden = true;
    success.hidden = false;
    window.requestAnimationFrame(function () { success.classList.add('is-visible'); });
    var heading = success.querySelector('h3');
    if (heading) heading.focus();
  };

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      success.classList.remove('is-visible');
      success.hidden = true;
      form.hidden = false;
      form.reset();
      requiredFields.forEach(clearError);
      setStatus('', '');
      autoGrow();
      var first = form.querySelector('#name');
      if (first) first.focus();
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var firstInvalid = null;
    requiredFields.forEach(function (field) {
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
      showSuccess('');
      return;
    }

    var name = String(data.get('name') || '').trim();
    var email = String(data.get('email') || '').trim();
    var company = String(data.get('company') || '').trim();
    var message = String(data.get('message') || '').trim();
    var action = form.getAttribute('action') || '';

    // Default: no backend configured, so hand off to the visitor's email app.
    if (action.indexOf('mailto:') === 0) {
      var to = action.slice('mailto:'.length).split('?')[0] || contactEmail;
      var subject = 'Website inquiry from ' + name + (company ? ' (' + company + ')' : '');
      var signature = [name, company, email].filter(Boolean).join('\n');
      var body = message + '\n\n--\n' + signature;
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      setStatus('info', 'Your email app should open with your message ready to send. If it doesn’t, you can write to', true);
      return;
    }

    // Formspree (or another form endpoint): submit in the background.
    // Formspree uses the "email" field as the reply-to address and "_subject" as the email subject.
    data.append('_subject', 'New inquiry from ' + name + (company ? ' (' + company + ')' : '') + ' via mrhsolutions.co');

    setBusy(true);
    setStatus('', '');

    fetch(action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          requiredFields.forEach(clearError);
          autoGrow();
          showSuccess(name);
          return;
        }
        // Formspree explains rejected submissions as { errors: [{ field, message }] }.
        return response.json().catch(function () { return {}; }).then(function (result) {
          var fieldErrors = (result && result.errors) || [];
          var firstField = null;
          fieldErrors.forEach(function (err) {
            var field = err.field && form.querySelector('[name="' + err.field + '"]');
            if (field && requiredFields.indexOf(field) !== -1) {
              var text = String(err.message || 'Please check this field');
              showError(field, text.charAt(0).toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? '' : '.'));
              if (!firstField) firstField = field;
            }
          });
          if (firstField) {
            setStatus('error', 'Please check the highlighted fields.');
            firstField.focus();
          } else {
            throw new Error('Request failed with status ' + response.status);
          }
        });
      })
      .catch(function () {
        setStatus('error', 'Sorry, something went wrong sending your message. Please try again or email', true);
      })
      .then(function () { setBusy(false); });
  });
})();
