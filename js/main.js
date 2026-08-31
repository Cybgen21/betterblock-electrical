/**
 * Betterblock Electrical — interactions (performance-first)
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  /* ── Lenis (desktop only) ── */
  let lenis;
  if (!prefersReducedMotion && !isMobile && typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Light ambient canvas (no O(n²) links, few particles) ── */
  const canvas = document.getElementById('electric-canvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    const count = isMobile ? 14 : 24;
    let particles = [];
    let running = true;
    let rafId = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        scale: Math.random() * 0.55 + 1.1,
        a: Math.random() * 0.3 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.012 + Math.random() * 0.02,
      }));
    }

    function drawBulb(x, y, scale, glow) {
      const s = scale;
      ctx.save();
      ctx.translate(x, y);

      ctx.beginPath();
      ctx.ellipse(0, -2 * s, 11 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 210, 80, ${glow * 0.18})`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-5.5 * s, 3 * s);
      ctx.bezierCurveTo(-5.5 * s, -9 * s, 5.5 * s, -9 * s, 5.5 * s, 3 * s);
      ctx.lineTo(4.2 * s, 5.5 * s);
      ctx.lineTo(-4.2 * s, 5.5 * s);
      ctx.closePath();
      ctx.fillStyle = `rgba(255, 248, 220, ${glow * 0.9})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(180, 140, 50, ${glow * 0.75})`;
      ctx.lineWidth = 0.9 * s;
      ctx.stroke();

      ctx.fillStyle = `rgba(130, 135, 145, ${glow * 0.95})`;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-3.8 * s, (6.5 + i * 2.1) * s, 7.6 * s, 1.4 * s);
      }
      ctx.fillRect(-3 * s, 14.8 * s, 6 * s, 2.2 * s);

      ctx.strokeStyle = `rgba(255, 190, 40, ${glow})`;
      ctx.lineWidth = 0.85 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2.2 * s, 0);
      ctx.lineTo(0, -5.5 * s);
      ctx.lineTo(2.2 * s, 0);
      ctx.stroke();

      if (glow > 0.45) {
        ctx.strokeStyle = `rgba(255, 230, 140, ${(glow - 0.45) * 0.35})`;
        ctx.lineWidth = 0.6 * s;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 7 * s, -2 * s + Math.sin(angle) * 7 * s);
          ctx.lineTo(Math.cos(angle) * 10.5 * s, -2 * s + Math.sin(angle) * 10.5 * s);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;
        if (p.x < -20) p.x = window.innerWidth + 20;
        if (p.x > window.innerWidth + 20) p.x = -20;
        if (p.y < -20) p.y = window.innerHeight + 20;
        if (p.y > window.innerHeight + 20) p.y = -20;

        const glow = p.a * (0.65 + 0.35 * Math.sin(p.twinkle));
        drawBulb(p.x, p.y, p.scale, glow);
      }
      rafId = requestAnimationFrame(frame);
    }

    resize();
    initParticles();
    frame();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        initParticles();
      }, 200);
    });

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) frame();
      else cancelAnimationFrame(rafId);
    });
  }

  /* Remove unused spark canvas if present */
  const sparkCanvas = document.getElementById('spark-canvas');
  if (sparkCanvas) sparkCanvas.remove();

  /* ── Soft cursor glow (ambient, not a ring) ── */
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && !isMobile && !prefersReducedMotion) {
    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursorGlow.classList.add('is-active');
    });

    function moveGlow() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursorGlow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(moveGlow);
    }
    moveGlow();
  } else if (cursorGlow) {
    cursorGlow.remove();
  }

  /* ── Site loader → hero reveal ── */
  function runHeroEntrance() {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .to('.hero-badge', { opacity: 1, y: 0, duration: 0.6, delay: 0.15 })
      .to('.hero-title .word', { y: 0, duration: 0.8, stagger: 0.06 }, '-=0.35')
      .to('.hero-lead', { opacity: 1, duration: 0.6 }, '-=0.4')
      .to('.hero-actions', { opacity: 1, duration: 0.6 }, '-=0.4')
      .to('.hero-trust', { opacity: 1, duration: 0.6 }, '-=0.3');

    heroTl.from('.hero-visual', { scale: 0.88, opacity: 0, duration: 0.85 }, '-=0.3');
  }

  /* ── Workshop ref (used by scroll reveals) ── */
  const workshop = document.querySelector('.workshop');

  function finishLoading() {
    document.body.classList.remove('is-loading');
    runHeroEntrance();
    requestAnimationFrame(() => {
      initScrollReveals();
      ScrollTrigger.refresh();
    });
  }

  /* ── Scroll-triggered reveals (fade up as you scroll) ── */
  function initScrollReveals() {
    const reveal = (targets, opts = {}) => {
      const els = gsap.utils.toArray(targets);
      if (!els.length) return;

      if (prefersReducedMotion) {
        gsap.set(els, { opacity: 1, y: 0, scale: 1, clearProps: 'transform,opacity' });
        return;
      }

      gsap.from(els, {
        scrollTrigger: {
          trigger: opts.trigger || els[0].parentElement || els[0],
          start: opts.start || 'top 88%',
          once: true,
        },
        y: opts.y ?? 36,
        opacity: 0,
        scale: opts.scale ?? 1,
        duration: opts.duration ?? 0.75,
        stagger: opts.stagger ?? 0,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    };

    /* Section headings — tag, title, description stagger in */
    gsap.utils.toArray('.section-header').forEach((header) => {
      reveal(header.children, { trigger: header, y: 28, stagger: 0.1, duration: 0.7 });
    });

    /* Marquee strip */
    reveal('.marquee-section', { trigger: '.marquee-section', y: 12, duration: 0.6, start: 'top 95%' });

    /* Services */
    reveal('.service-card', {
      trigger: '.services-grid',
      y: 40,
      stagger: 0.08,
      start: 'top 85%',
    });

    /* Process steps */
    reveal('.process-step', {
      trigger: '.process-steps-wrap',
      y: 32,
      stagger: 0.14,
      start: 'top 85%',
    });

    /* Coverage map + town pills */
    reveal('.areas-visual', { trigger: '.areas', y: 24, scale: 0.92, duration: 0.8, start: 'top 85%' });
    reveal('.areas-grid span', { trigger: '.areas-grid', y: 16, stagger: 0.035, duration: 0.5, start: 'top 90%' });
    reveal('.areas-note', { trigger: '.areas-note', y: 16, duration: 0.6, start: 'top 92%' });

    /* FAQ */
    reveal('.faq-item', {
      trigger: '.faq-list',
      y: 24,
      stagger: 0.08,
      start: 'top 88%',
    });

    /* About */
    reveal('.about-text', { trigger: '.about-strip', y: 32, start: 'top 82%' });
    reveal('.about-values li', { trigger: '.about-values', y: 14, stagger: 0.07, duration: 0.5, start: 'top 88%' });

    /* Workshop */
    if (workshop) {
      reveal('.workshop-tag', { trigger: workshop, y: 20, duration: 0.6, start: 'top 85%' });
      reveal('.workshop-title', { trigger: workshop, y: 32, duration: 0.75, start: 'top 82%' });
      reveal('.workshop-stage', { trigger: workshop, y: 40, scale: 0.96, duration: 0.9, start: 'top 80%' });
      reveal('.workshop-caption', { trigger: workshop, y: 16, duration: 0.55, start: 'top 75%' });
    }

    /* Contact */
    reveal('.contact-copy > .section-tag, .contact-copy > .section-title, .contact-copy > p', {
      trigger: '.contact-copy',
      y: 28,
      stagger: 0.1,
      duration: 0.65,
      start: 'top 85%',
    });
    reveal('.contact-method', {
      trigger: '.contact-methods',
      y: 24,
      stagger: 0.12,
      duration: 0.6,
      start: 'top 90%',
    });
    reveal('.contact-extra', {
      trigger: '.contact-extras',
      y: 20,
      stagger: 0.08,
      duration: 0.5,
      start: 'top 92%',
    });
    reveal('.contact-card-link', { trigger: '.contact-card-link', y: 16, duration: 0.5, start: 'top 92%' });

    /* Footer */
    reveal('.footer-brand, .footer-links', {
      trigger: '.site-footer',
      y: 20,
      stagger: 0.1,
      duration: 0.6,
      start: 'top 92%',
    });
  }

  const siteLoader = document.querySelector('.site-loader');
  const powerFlash = document.querySelector('.power-flash');
  if (powerFlash) powerFlash.remove();

  if (siteLoader && !prefersReducedMotion) {
    const fill = siteLoader.querySelector('.loader-bar-fill');
    const status = siteLoader.querySelector('.loader-status');
    const flash = siteLoader.querySelector('.loader-flash');
    const lightning = siteLoader.querySelector('.loader-lightning');
    const content = siteLoader.querySelector('.loader-content');
    const statuses = ['Powering up', 'Checking circuits', 'Going live'];

    const loadTl = gsap.timeline({
      onComplete: () => {
        siteLoader.classList.add('is-done');
        setTimeout(() => siteLoader.remove(), 650);
        finishLoading();
      },
    });

    loadTl
      .to(fill, {
        width: '100%',
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: function () {
          const step = Math.min(Math.floor(this.progress() * statuses.length), statuses.length - 1);
          if (status) status.textContent = statuses[step];
          const bar = siteLoader.querySelector('.loader-bar');
          if (bar) bar.setAttribute('aria-valuenow', String(Math.round(this.progress() * 100)));
        },
      })
      .add(() => {
        lightning?.classList.add('strike');
        flash?.classList.add('active');
      })
      .to(content, { opacity: 0, scale: 1.06, duration: 0.4, ease: 'power2.in' }, '-=0.15');
  } else {
    if (siteLoader) siteLoader.remove();
    finishLoading();
  }

  /* ── Scroll progress (throttled via ST) ── */
  const progressBar = document.querySelector('.scroll-progress-bar');
  if (progressBar) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        progressBar.style.width = `${(self.progress * 100).toFixed(1)}%`;
      },
    });
  }

  /* ── Hero entrance handled after loader ── */

  /* ── Light tilt (CSS transform only, no elastic) ── */
  if (!isMobile && !prefersReducedMotion) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ── Workshop scene trigger ── */
  if (workshop) {
    if (prefersReducedMotion) {
      workshop.classList.add('is-live');
    } else {
      ScrollTrigger.create({
        trigger: workshop,
        start: 'top 75%',
        once: true,
        onEnter: () => workshop.classList.add('is-live'),
      });
    }
  }

  /* ── Circuit line ── */
  const circuitPath = document.querySelector('.circuit-path');
  if (circuitPath) {
    if (prefersReducedMotion) {
      circuitPath.style.strokeDashoffset = '0';
    } else {
      gsap.to(circuitPath, {
        scrollTrigger: {
          trigger: '.process-steps-wrap',
          start: 'top 75%',
          end: 'bottom 65%',
          scrub: 1,
        },
        strokeDashoffset: 0,
        ease: 'none',
      });
    }
  }

  /* ── Mobile sticky CTA ── */
  const mobileCta = document.querySelector('.mobile-cta-bar');
  if (mobileCta && isMobile) {
    document.body.classList.add('has-mobile-cta');
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'bottom top',
      onEnter: () => mobileCta.classList.add('visible'),
      onLeaveBack: () => mobileCta.classList.remove('visible'),
    });
  }

  /* ── Scroll reveals initialized after loader in finishLoading() ── */

  window.addEventListener('load', () => ScrollTrigger.refresh());

  /* ── Service cards → contact ── */
  document.querySelectorAll('.service-card').forEach((card) => {
    card.addEventListener('click', () => {
      const target = document.querySelector('#contact');
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── Magnetic buttons (desktop, light) ── */
  if (!isMobile && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.2;
        const y = (e.clientY - r.top - r.height / 2) * 0.2;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── Mobile menu ── */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const menuBackdrop = document.querySelector('.mobile-menu-backdrop');
  const menuCloseBtn = document.querySelector('.mobile-menu-close');

  function setMenuOpen(open) {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.toggle('open', open);
    menuToggle.classList.toggle('active', open);
    menuToggle.setAttribute('aria-expanded', open);
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    animateMenuLinks(open);
  }

  function animateMenuLinks(open) {
    if (prefersReducedMotion || !mobileMenu) return;
    const links = mobileMenu.querySelectorAll('nav a');
    const actions = mobileMenu.querySelectorAll('.mobile-menu-actions > *');
    if (open) {
      gsap.fromTo(links, { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out', delay: 0.12, clearProps: 'transform' });
      gsap.fromTo(actions, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out', delay: 0.45, clearProps: 'transform' });
    } else {
      gsap.set(links, { clearProps: 'all' });
      gsap.set(actions, { clearProps: 'all' });
    }
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      setMenuOpen(!mobileMenu.classList.contains('open'));
    });

    menuBackdrop?.addEventListener('click', () => setMenuOpen(false));
    menuCloseBtn?.addEventListener('click', () => setMenuOpen(false));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        setMenuOpen(false);
      }
    });

    mobileMenu.querySelectorAll('nav a, .mobile-menu-actions a').forEach((link) => {
      link.addEventListener('click', () => setMenuOpen(false));
    });
  }

  /* ── Header hide ── */
  let lastScroll = 0;
  const header = document.querySelector('.site-header');
  ScrollTrigger.create({
    start: 100,
    onUpdate: (self) => {
      if (document.body.classList.contains('menu-open')) {
        header.classList.remove('hidden');
        return;
      }
      const current = self.scroll();
      if (current > lastScroll && current > 200) header.classList.add('hidden');
      else header.classList.remove('hidden');
      lastScroll = current;
    },
  });

  /* ── Counter ── */
  const countEl = document.querySelector('[data-count]');
  if (countEl) {
    ScrollTrigger.create({
      trigger: countEl,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        const target = parseInt(countEl.dataset.count, 10);
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: function () {
            countEl.textContent = Math.round(this.targets()[0].val);
          },
        });
      },
    });
  }

  /* ── Anchors ── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();
