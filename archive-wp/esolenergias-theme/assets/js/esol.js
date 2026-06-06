/**
 * eSol Energías — esol.js
 * Navbar · Theme toggle · Scroll reveal · Mobile menu · AJAX Contact Form
 */
(function () {
  'use strict';

  /* ══════════════════════════
     THEME TOGGLE (dark / light)
     Manejado por theme-manager.js
  ══════════════════════════ */
  // Theme toggle logic moved to theme-manager.js to avoid conflicts
  // theme-manager.js handles all dark/light mode switching

  /* ══════════════════════════
     NAVBAR SCROLL
  ══════════════════════════ */
  const nav = document.getElementById('navbar');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('nav-scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ══════════════════════════
     MOBILE MENU
  ══════════════════════════ */
  const menuBtn    = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon   = document.getElementById('menuIcon');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      const isOpen = !mobileMenu.hidden;
      mobileMenu.hidden = isOpen;
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
      if (menuIcon) {
        menuIcon.innerHTML = isOpen
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>';
      }
    });
  }

  window.closeMobile = function () {
    if (mobileMenu) mobileMenu.hidden = true;
    if (menuBtn)    menuBtn.setAttribute('aria-expanded', 'false');
    if (menuIcon)   menuIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>';
  };

  /* ══════════════════════════
     SCROLL REVEAL
  ══════════════════════════ */
  // Only run if GSAP is NOT enabled to prevent conflicts
  if (document.documentElement.getAttribute('data-gsap-enabled') !== 'true') {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('up');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

      document.querySelectorAll('.reveal, .reveal-left').forEach(function (el) {
        io.observe(el);
      });
  }

  /* ══════════════════════════
     CONTACT FORM — AJAX
     Usa wp-ajax (functions.php)
  ══════════════════════════ */
  const form       = document.getElementById('esolForm');
  const formMsg    = document.getElementById('formMsg');
  const submitBtn  = document.getElementById('formSubmit');

  if (form && typeof esolData !== 'undefined') {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validación básica
      const nombre  = form.querySelector('#nombre').value.trim();
      const email   = form.querySelector('#email').value.trim();
      const interes = form.querySelector('#interes').value;

      if (!nombre || !email || !interes) {
        showMsg('Por favor completa todos los campos requeridos.', 'error');
        return;
      }

      // Estado de carga
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';

      const data = new FormData(form);
      data.append('action', 'esol_contact');
      data.append('nonce',  esolData.nonce);

      fetch(esolData.ajaxUrl, {
        method: 'POST',
        body:   data,
        credentials: 'same-origin',
      })
        .then(function (res) { return res.json(); })
        .then(function (res) {
          if (res.success) {
            form.reset();
            submitBtn.style.display = 'none';
            showMsg(res.data.message || 'Mensaje enviado. Te contactaremos pronto.', 'success');
          } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Enviar Mensaje';
            showMsg(res.data.message || 'Error al enviar. Por favor intenta de nuevo.', 'error');
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Enviar Mensaje';
          showMsg('Error de conexión. Por favor escríbenos por WhatsApp.', 'error');
        });
    });
  }

  function showMsg(text, type) {
    if (!formMsg) return;
    formMsg.textContent = text;
    formMsg.className   = type;
    formMsg.style.display = 'block';
  }

})();
