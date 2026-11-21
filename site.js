// ValPulse site motion: smooth scroll, reveals, scroll-linked parallax and the "unboxing" story.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const fmt = (n) => n.toLocaleString('en-US');

  // The ValPulse mark, stamped from one template.
  const tpl = $('#markTpl');
  $$('[data-mark]').forEach((m) => m.append(tpl.content.cloneNode(true)));

  // Phones: full real app captures, shown at their exact screen shape.
  const icons = (c) => `<span class="sb-ic"><svg width="18" height="11" viewBox="0 0 18 11" fill="${c}"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg><svg width="16" height="11" viewBox="0 0 16 11" fill="${c}"><path d="M8 2.2c2.2 0 4.2.9 5.7 2.3l1.1-1.2A9.5 9.5 0 008 .6 9.5 9.5 0 001.2 3.3l1.1 1.2A8 8 0 018 2.2zm0 3.1c1.3 0 2.5.5 3.4 1.3l1.1-1.2A6.4 6.4 0 008 3.7a6.4 6.4 0 00-4.5 1.7l1.1 1.2A4.8 4.8 0 018 5.3zm0 3.1c.5 0 .9.2 1.2.4L8 10.2 6.8 8.8c.3-.3.7-.4 1.2-.4z"/></svg><svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="${c}" opacity=".4"/><rect x="2" y="2" width="18" height="8" rx="2" fill="${c}"/><path d="M23 4v4a2 2 0 000-4z" fill="${c}" opacity=".4"/></svg></span>`;
  $$('.phone[data-img]').forEach((p) => {
    p.innerHTML = `<div class="scr"><img src="${p.dataset.img}" alt="" loading="lazy" decoding="async"><div class="di"></div></div>`;
  });

  // Headline words rise one by one.
  $$('[data-words]').forEach((h) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part;
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span');
          n.replaceWith(w); s.append(n); w.append(s);
        }
      });
    };
    walk(h);
    $$('.w > span', h).forEach((s, i) => s.style.setProperty('--d', `${0.08 + i * 0.07}s`));
  });

  // Reveal on enter.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.rv, [data-words]').forEach((el) => io.observe(el));

  // The pulse line draws itself in the hero mark, and again in the final one.
  requestAnimationFrame(() => setTimeout(() => $('#heroMark')?.classList.add('drawn'), 250));
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { e.target.classList.add('drawn'); o.disconnect(); } }, { threshold: .6 })
    .observe($('#finalMark'));

  // Count-ups.
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, to = +el.dataset.count;
      const t0 = performance.now(), dur = reduce ? 1 : 1600;
      const tick = (t) => {
        const k = ease(clamp((t - t0) / dur));
        el.textContent = fmt(Math.round(to * k));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  // Mystery box you can open yourself.
  const fd = $('#flipDemo');
  const flip = () => fd.classList.toggle('open');
  fd?.addEventListener('click', flip);
  fd?.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } });

  // Smooth FAQ open/close.
  $$('.faq details').forEach((d) => {
    const s = $('summary', d), a = $('.ans', d);
    s.addEventListener('click', (e) => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.7,0,.84,0)' })
          .onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        const h = a.offsetHeight;
        a.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  // Film: plays while on screen, sound on request.
  const film = $('#film-frame'), video = $('#filmVideo'), snd = $('#soundBtn');
  if (video) {
    let inView = false;
    const sync = () => { inView ? video.play().catch(() => {}) : video.pause(); };
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: .35 }).observe(video);
    video.addEventListener('loadeddata', sync);
    snd.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted) { video.currentTime = 0; video.play(); }
      $('#sndOff').hidden = !video.muted; $('#sndOn').hidden = video.muted;
      snd.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
    });
  }

  // A live reset countdown, like the app's.
  let left = 21 * 3600 + 58 * 60 + 27;
  const clock = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':');
  const cReset = $('#cReset'), hReset = $('#hReset');
  setInterval(() => { left = Math.max(0, left - 1); cReset.textContent = hReset.textContent = clock(left); }, 1000);

  // Story: the boxes open one by one as you scroll through the pinned section.
  const story = $('#how'), boxes = $$('#boxes .box'), burst = $('#burst');
  const cOpen = $('#cOpen'), cValue = $('#cValue');
  let shownValue = 0, targetValue = 0;
  const setStory = (p) => {
    let open = 0, value = 0;
    boxes.forEach((b) => { const on = p >= +b.dataset.at; b.classList.toggle('open', on); if (on) { open++; value += +b.dataset.vp; } });
    burst.style.opacity = p > .1 && p < .9 ? 1 : 0;
    burst.style.setProperty('--by', `${15 + p * 75}%`);
    cOpen.textContent = `${open} / 4`;
    targetValue = value;
  };
  // On small screens the story isn't pinned: open the boxes as they come into view.
  if (innerWidth <= 900 || reduce) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      boxes.forEach((b, i) => setTimeout(() => setStory(+b.dataset.at), reduce ? 0 : 500 + i * 450));
    }, { threshold: .4 }).observe($('#boxes'));
  }

  // Scroll-linked frame.
  const nav = $('#nav'), stage = $('#stage'), par = $$('[data-par]');
  let lastY = -1;
  const frame = () => {
    const y = scrollY, vh = innerHeight;
    // The shop value glides toward its new total.
    if (shownValue !== targetValue) {
      shownValue += (targetValue - shownValue) * .12;
      if (Math.abs(targetValue - shownValue) < 1) shownValue = targetValue;
      cValue.textContent = fmt(Math.round(shownValue));
    }
    if (y === lastY) return;
    lastY = y;
    nav.classList.toggle('scrolled', y > 10);

    if (!reduce && stage) {
      const r = stage.getBoundingClientRect();
      const k = clamp(1 - r.top / vh);
      par.forEach((el) => {
        const f = +el.dataset.par;
        const tilt = el.classList.contains('p-center') ? (1 - clamp(k * 1.6)) * 14 : 0;
        el.style.transform = `translateY(${(y * f).toFixed(1)}px) rotateX(${tilt.toFixed(2)}deg)`;
      });
    }

    if (story && innerWidth > 900 && !reduce) {
      const r = story.getBoundingClientRect();
      setStory(clamp(-r.top / (r.height - vh)));
    }

    if (!reduce && film) {
      const r = film.getBoundingClientRect();
      const k = ease(clamp((vh - r.top) / (vh * .85)));
      film.style.transform = `scale(${(0.84 + k * 0.16).toFixed(4)})`;
      film.style.borderRadius = `${(56 - k * 20).toFixed(1)}px`;
    }
  };

  // Lenis smooth scrolling when available; plain scroll otherwise.
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -40 });
    }));
  }
  const loop = (t) => { lenis?.raf(t); frame(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
