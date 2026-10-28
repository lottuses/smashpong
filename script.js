(function ensureMotionLibs() {
  const noop = () => {};
  if (typeof window.ScrollTrigger === 'undefined') {
    window.ScrollTrigger = { isStub: true, create: noop, refresh: noop };
  }
  if (typeof window.gsap === 'undefined') {
    const toArray = (t) => {
      if (!t) return [];
      if (typeof t === 'string') return Array.from(document.querySelectorAll(t));
      if (t instanceof Element) return [t];
      return Array.from(t);
    };
    const applyVars = (t, vars) => toArray(t).forEach((el) => {
      if (!(el instanceof Element) || !vars) return;
      if ('x' in vars || 'y' in vars) {
        const x = vars.x || 0;
        const y = vars.y || 0;
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
      if ('height' in vars) {
        el.style.height = typeof vars.height === 'number' ? `${vars.height}px` : vars.height;
      }
      if ('opacity' in vars) {
        el.style.opacity = String(vars.opacity);
      }
      if (vars.clearProps) {
        el.style.transform = '';
        el.style.opacity = '';
      }
    });
    const timeline = () => {
      const tl = { fromTo: () => tl, to: () => tl };
      return tl;
    };
    window.gsap = {
      registerPlugin: noop,
      killTweensOf: noop,
      set: applyVars,
      to(t, vars) {
        applyVars(t, vars);
        if (vars && vars.onComplete) vars.onComplete();
      },
      fromTo(t, fromVars, toVars) {
        applyVars(t, toVars);
        if (toVars && toVars.onComplete) toVars.onComplete();
      },
      timeline,
      utils: { toArray }
    };
  }
})();

if (!ScrollTrigger.isStub) gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('dragstart', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    e.preventDefault();
  }
});

document.querySelectorAll('.btn-brutal-primary, .btn-brutal-secondary, .carousel-btn, .day-pill, .event-tab, .off-cta-link, .time-action, .lightbox-action-btn, .lightbox-nav-btn, .loc-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.classList.remove('click-confirm');
    void btn.offsetWidth;
    btn.classList.add('click-confirm');
    window.setTimeout(() => btn.classList.remove('click-confirm'), 180);
  });
});

const navbar = document.getElementById('navbar');
const navMenuToggle = document.getElementById('nav-menu-toggle');
const siteNav = document.getElementById('site-nav');
const navLinks = siteNav ? Array.from(siteNav.querySelectorAll('.nav-link')) : [];
const navMenuLabel = navMenuToggle ? navMenuToggle.querySelector('.sr-only') : null;
let lastMenuTrigger = null;
let activeNavLock = false;
let activeNavUnlockTimer;

function setMenuLabel(isOpen) {
  if (navMenuLabel) navMenuLabel.textContent = isOpen ? 'Fechar menu' : 'Abrir menu';
}

function setActiveNavLink(id) {
  navLinks.forEach((link) => {
    if (id && link.getAttribute('href') === `#${id}`) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function lockActiveNav(id) {
  setActiveNavLink(id);
  activeNavLock = true;
  window.clearTimeout(activeNavUnlockTimer);
  activeNavUnlockTimer = window.setTimeout(() => {
    activeNavLock = false;
    updateActiveNavLink();
  }, 1500);
}

function closeMobileMenu(restoreFocus = true) {
  if (!navMenuToggle || !siteNav) return;
  navMenuToggle.setAttribute('aria-expanded', 'false');
  siteNav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  setMenuLabel(false);
  if (lastMenuTrigger && restoreFocus) {
    lastMenuTrigger.focus();
  }
  lastMenuTrigger = null;
}

navMenuToggle?.addEventListener('click', () => {
  const isOpen = navMenuToggle.getAttribute('aria-expanded') === 'true';
  if (!isOpen) lastMenuTrigger = navMenuToggle;
  navMenuToggle.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
  setMenuLabel(!isOpen);
  if (!isOpen && navLinks.length) {
    if (!prefersReducedMotion) {
      gsap.fromTo(
        '#site-nav .nav-links > li',
        { y: -10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, stagger: 0.035, ease: 'power2.out', clearProps: 'transform,opacity' }
      );
    }
    window.setTimeout(() => navLinks[0].focus(), 50);
  }
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const targetId = link.getAttribute('href')?.slice(1);
    if (targetId) lockActiveNav(targetId);
    closeMobileMenu(false);
  });
});

document.addEventListener('keydown', (event) => {
  const isMenuOpen = navMenuToggle?.getAttribute('aria-expanded') === 'true';
  if (!isMenuOpen) return;
  if (event.key === 'Escape') {
    closeMobileMenu(true);
  }
});

document.addEventListener('click', (event) => {
  const isMenuOpen = navMenuToggle?.getAttribute('aria-expanded') === 'true';
  if (!isMenuOpen || !siteNav || !navMenuToggle) return;
  if (!siteNav.contains(event.target) && !navMenuToggle.contains(event.target)) {
    closeMobileMenu(false);
  }
});

window.matchMedia('(min-width: 1181px)').addEventListener('change', (e) => {
  if (e.matches) closeMobileMenu(false);
});

const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function updateActiveNavLink() {
  if (activeNavLock) return;
  const documentBottom = window.scrollY + window.innerHeight;
  if (documentBottom >= document.documentElement.scrollHeight - 10 && navSections.length) {
    setActiveNavLink(navSections[navSections.length - 1].id);
    return;
  }
  const activationLine = (navbar?.offsetHeight || 93) + 120;
  let activeSection = null;
  navSections.forEach((sec) => {
    if (sec.getBoundingClientRect().top <= activationLine) {
      activeSection = sec;
    }
  });
  setActiveNavLink(activeSection?.id || null);
}

window.addEventListener('scroll', updateActiveNavLink, { passive: true });
updateActiveNavLink();

// ==========================================================
// MOTOR DE ZOOM INTERATIVO (DESKTOP: CLIQUE ONDE QUISER | MOBILE: PINÇA)
// ==========================================================
function attachInteractiveZoom(container, getActiveImgFn) {
  if (!container || container._zoomAttached) return null;
  container._zoomAttached = true;

  let scale = 1;
  let tx = 0;
  let ty = 0;
  const DESKTOP_ZOOM = 2.5;
  const MAX_PINCH_ZOOM = 4;

  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let startTx = 0;
  let startTy = 0;
  let panMoved = false;

  let isPinching = false;
  let initialPinchDist = 0;
  let initialPinchScale = 1;
  let pinchMidX = 0;
  let pinchMidY = 0;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function applyTransform(animate = true) {
    const img = getActiveImgFn();
    if (!img || img.tagName !== 'IMG' || img.hidden) return;

    img.classList.add('zoom-target-img');
    const baseW = img.offsetWidth || container.clientWidth;
    const baseH = img.offsetHeight || container.clientHeight;
    const maxTx = Math.max(0, (baseW * scale - baseW) / 2);
    const maxTy = Math.max(0, (baseH * scale - baseH) / 2);

    tx = clamp(tx, -maxTx, maxTx);
    ty = clamp(ty, -maxTy, maxTy);

    img.classList.toggle('is-gesture-active', !animate);

    if (scale <= 1.01) {
      scale = 1;
      tx = 0;
      ty = 0;
      img.style.transform = '';
      img.classList.remove('is-zoomed');
      container.classList.remove('zoom-container-active');
    } else {
      img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
      img.classList.add('is-zoomed');
      container.classList.add('zoom-container-active');
    }
  }

  function resetZoom(animate = true) {
    scale = 1;
    tx = 0;
    ty = 0;
    const img = getActiveImgFn();
    if (img && img.tagName === 'IMG') {
      img.classList.toggle('is-gesture-active', !animate);
      img.style.transform = '';
      img.classList.remove('is-zoomed');
    }
    container.classList.remove('zoom-container-active');
  }

  // DESKTOP: Clique onde o usuário quiser para dar zoom nesse ponto exato + arrastar (pan)
  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || scale <= 1) return;
    if (e.target.closest('button, a, .frame-mini-controls, .custom-video-player, .img-zoom-badge, .lightbox-nav-btn')) return;
    const img = getActiveImgFn();
    if (!img || img.tagName !== 'IMG' || img.hidden) return;

    isPanning = true;
    panMoved = false;
    panStartX = e.clientX;
    panStartY = e.clientY;
    startTx = tx;
    startTy = ty;
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    if (Math.hypot(dx, dy) > 5) panMoved = true;
    tx = startTx + dx;
    ty = startTy + dy;
    applyTransform(false);
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      const img = getActiveImgFn();
      if (img) img.classList.remove('is-gesture-active');
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.closest('button, a, .frame-mini-controls, .custom-video-player, .img-zoom-badge, .lightbox-nav-btn, .slide-caption')) return;
    // Ignora cliques simulados pelo touch em dispositivos móveis (o mobile usa pinça)
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const slideEl = container.closest('.carousel-slide') || (container.classList.contains('carousel-slide') ? container : null);
    if (slideEl && !slideEl.classList.contains('is-center')) return;

    const img = getActiveImgFn();
    if (!img || img.tagName !== 'IMG' || img.hidden) return;

    if (panMoved) {
      panMoved = false;
      e.stopPropagation();
      return;
    }

    if (container._lastSwipeDist && container._lastSwipeDist > 12) return;

    e.stopPropagation();

    if (scale > 1) {
      resetZoom(true);
    } else {
      const rect = img.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      scale = DESKTOP_ZOOM;
      tx = (centerX - clickX) * (scale - 1);
      ty = (centerY - clickY) * (scale - 1);
      applyTransform(true);
    }
  });

  // MOBILE: Zoom com Pinça (2 dedos) + Pan com 1 dedo quando ampliado
  container.addEventListener('touchstart', (e) => {
    const img = getActiveImgFn();
    if (!img || img.tagName !== 'IMG' || img.hidden) return;

    const slideEl = container.closest('.carousel-slide') || (container.classList.contains('carousel-slide') ? container : null);
    if (slideEl && !slideEl.classList.contains('is-center')) return;

    if (e.touches.length === 2) {
      isPinching = true;
      isPanning = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      initialPinchScale = scale;

      const rect = img.getBoundingClientRect();
      const currentCenterX = rect.left + rect.width / 2;
      const currentCenterY = rect.top + rect.height / 2;
      const midClientX = (t1.clientX + t2.clientX) / 2;
      const midClientY = (t1.clientY + t2.clientY) / 2;

      pinchMidX = (midClientX - currentCenterX) / scale;
      pinchMidY = (midClientY - currentCenterY) / scale;
      startTx = tx;
      startTy = ty;
      e.preventDefault();
    } else if (e.touches.length === 1 && scale > 1) {
      if (e.target.closest('button, a, .frame-mini-controls, .custom-video-player, .img-zoom-badge, .lightbox-nav-btn')) return;
      isPanning = true;
      panStartX = e.touches[0].clientX;
      panStartY = e.touches[0].clientY;
      startTx = tx;
      startTy = ty;
    }
  }, { passive: false });

  container.addEventListener('touchmove', (e) => {
    const img = getActiveImgFn();
    if (!img || img.tagName !== 'IMG' || img.hidden) return;

    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (initialPinchDist > 0) {
        const nextScale = clamp(initialPinchScale * (dist / initialPinchDist), 1, MAX_PINCH_ZOOM);
        const scaleDiff = nextScale - initialPinchScale;
        scale = nextScale;
        tx = startTx - pinchMidX * scaleDiff;
        ty = startTy - pinchMidY * scaleDiff;
        applyTransform(false);
      }
    } else if (isPanning && e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      e.stopPropagation();
      const dx = e.touches[0].clientX - panStartX;
      const dy = e.touches[0].clientY - panStartY;
      tx = startTx + dx;
      ty = startTy + dy;
      applyTransform(false);
    }
  }, { passive: false });

  function onTouchEnd(e) {
    if (isPinching && e.touches.length < 2) {
      isPinching = false;
      if (scale <= 1.05) {
        resetZoom(true);
      } else if (e.touches.length === 1) {
        isPanning = true;
        panStartX = e.touches[0].clientX;
        panStartY = e.touches[0].clientY;
        startTx = tx;
        startTy = ty;
      }
    }
    if (e.touches.length === 0) {
      isPanning = false;
      if (scale <= 1.05) resetZoom(true);
    }
  }

  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('touchcancel', () => {
    isPinching = false;
    isPanning = false;
    if (scale <= 1.05) resetZoom(true);
  });

  const controller = {
    reset: resetZoom,
    isZoomed: () => scale > 1 || isPinching
  };
  container._zoomController = controller;
  return controller;
}

// ==========================================================
// REPRODUTOR DE VÍDEO CUSTOMIZADO
// ==========================================================
const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2, 0.5];

function formatMediaTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function createVideoPlayerController(container, initialVideo = null) {
  if (!container) return null;

  let currentVideo = initialVideo;
  const bar = document.createElement('div');
  bar.className = 'custom-video-player';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Controles de reprodução do vídeo');

  bar.innerHTML = `
    <button type="button" class="vp-btn vp-play-btn" aria-label="Reproduzir vídeo" title="Reproduzir (Play)">
      <span>▶</span>
    </button>
    <button type="button" class="vp-btn vp-pause-btn" aria-label="Pausar vídeo" title="Pausar (Pause)">
      <span>❚❚</span>
    </button>
    <button type="button" class="vp-btn vp-rw" aria-label="Retroceder 5 segundos" title="Retroceder 5 segundos">
      <span>-5s</span>
    </button>
    <button type="button" class="vp-btn vp-ff" aria-label="Avançar 5 segundos" title="Avançar 5 segundos">
      <span>+5s</span>
    </button>
    <div class="vp-timeline">
      <input type="range" class="vp-seek" min="0" max="100" step="0.1" value="0" aria-label="Linha do tempo do vídeo">
      <span class="vp-time">00:00 / 00:00</span>
    </div>
    <button type="button" class="vp-btn vp-speed" aria-label="Alterar velocidade do vídeo" title="Acelerar / Velocidade de reprodução">
      <span class="vp-speed-label">1x</span>
    </button>
  `;

  ['click', 'pointerdown', 'pointerup', 'mousedown', 'touchstart'].forEach((evt) => {
    bar.addEventListener(evt, (e) => e.stopPropagation());
  });

  const playBtn = bar.querySelector('.vp-play-btn');
  const pauseBtn = bar.querySelector('.vp-pause-btn');
  const rwBtn = bar.querySelector('.vp-rw');
  const ffBtn = bar.querySelector('.vp-ff');
  const seekInput = bar.querySelector('.vp-seek');
  const timeLabel = bar.querySelector('.vp-time');
  const speedBtn = bar.querySelector('.vp-speed');
  const speedLabel = bar.querySelector('.vp-speed-label');

  let isScrubbing = false;

  function syncUI() {
    if (!currentVideo) return;
    if (!currentVideo.muted) currentVideo.muted = true;

    const isPaused = currentVideo.paused;
    playBtn.classList.toggle('is-active', !isPaused);
    pauseBtn.classList.toggle('is-active', isPaused);
    playBtn.setAttribute('aria-pressed', String(!isPaused));
    pauseBtn.setAttribute('aria-pressed', String(isPaused));

    const dur = isFinite(currentVideo.duration) ? currentVideo.duration : 0;
    const cur = isFinite(currentVideo.currentTime) ? currentVideo.currentTime : 0;

    if (!isScrubbing && dur > 0) {
      seekInput.value = String((cur / dur) * 100);
    }
    timeLabel.textContent = `${formatMediaTime(cur)} / ${formatMediaTime(dur)}`;

    const rate = currentVideo.playbackRate || 1;
    speedLabel.textContent = `${rate}x`;
  }

  function skipSeconds(delta) {
    if (!currentVideo) return;
    const dur = isFinite(currentVideo.duration) ? currentVideo.duration : 0;
    const nextTime = Math.max(0, Math.min(dur || Infinity, (currentVideo.currentTime || 0) + delta));
    try {
      currentVideo.currentTime = nextTime;
    } catch (e) {}
    syncUI();
  }

  playBtn.addEventListener('click', () => {
    if (!currentVideo) return;
    currentVideo.muted = true;
    currentVideo._userPaused = false;
    currentVideo.play().catch(() => {});
    syncUI();
  });

  pauseBtn.addEventListener('click', () => {
    if (!currentVideo) return;
    currentVideo._userPaused = true;
    currentVideo.pause();
    syncUI();
  });

  rwBtn.addEventListener('click', () => skipSeconds(-5));
  ffBtn.addEventListener('click', () => skipSeconds(5));

  seekInput.addEventListener('input', () => {
    if (!currentVideo) return;
    isScrubbing = true;
    const dur = isFinite(currentVideo.duration) ? currentVideo.duration : 0;
    if (dur > 0) {
      const targetTime = (parseFloat(seekInput.value) / 100) * dur;
      timeLabel.textContent = `${formatMediaTime(targetTime)} / ${formatMediaTime(dur)}`;
    }
  });

  seekInput.addEventListener('change', () => {
    if (!currentVideo) return;
    const dur = isFinite(currentVideo.duration) ? currentVideo.duration : 0;
    if (dur > 0) {
      const targetTime = (parseFloat(seekInput.value) / 100) * dur;
      try {
        currentVideo.currentTime = targetTime;
      } catch (e) {}
    }
    isScrubbing = false;
    syncUI();
  });

  speedBtn.addEventListener('click', () => {
    if (!currentVideo) return;
    const curRate = currentVideo.playbackRate || 1;
    const idx = PLAYBACK_SPEEDS.indexOf(curRate);
    const nextRate = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length];
    currentVideo.playbackRate = nextRate;
    syncUI();
  });

  const videoEvents = ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'ratechange'];

  function attachVideo(videoEl) {
    if (currentVideo) {
      videoEvents.forEach((ev) => currentVideo.removeEventListener(ev, syncUI));
    }
    currentVideo = videoEl;
    if (currentVideo) {
      currentVideo.muted = true;
      videoEvents.forEach((ev) => currentVideo.addEventListener(ev, syncUI));
      syncUI();
    }
  }

  function setVisible(visible) {
    bar.classList.toggle('is-hidden', !visible);
  }

  container.appendChild(bar);
  if (initialVideo) attachVideo(initialVideo);

  return {
    bar,
    attachVideo,
    setVisible,
    syncUI,
    skipSeconds
  };
}

document.querySelectorAll('video[data-fallback-src]').forEach((vid) => {
  vid.muted = true;
  vid.addEventListener('error', function onVideoErr() {
    const fallback = vid.getAttribute('data-fallback-src');
    if (fallback && vid.getAttribute('src') !== fallback) {
      vid.setAttribute('src', fallback);
      vid.muted = true;
      vid.load();
    }
  }, { once: true });
});

const sectionGalleries = new Map();

function toHighResUrl(rawSrc) {
  if (!rawSrc) return '';
  return rawSrc.includes('images.unsplash.com')
    ? rawSrc.replace(/w=\d+/, 'w=1920').replace(/q=\d+/, 'q=90')
    : rawSrc;
}

document.querySelectorAll('[data-gallery-group]').forEach((groupEl) => {
  const groupId = groupEl.getAttribute('data-gallery-group');
  const groupTitle = groupEl.getAttribute('data-gallery-title') || 'SMASH PONG • GALERIA';
  if (!groupId) return;

  const imgs = Array.from(groupEl.querySelectorAll('img, video'));
  const items = imgs.map((img, idx) => {
    const isVideo = img.tagName === 'VIDEO';
    if (isVideo) img.muted = true;
    img.setAttribute('data-group-id', groupId);
    img.setAttribute('data-slide-index', String(idx));
    img.setAttribute('draggable', 'false');
    const slideCaption = img.closest('.carousel-slide')?.querySelector('.slide-caption')?.textContent?.trim();
    const caption = slideCaption || img.getAttribute('alt') || img.getAttribute('data-alt') || groupTitle;
    return {
      type: isVideo ? 'video' : 'image',
      el: img,
      src: toHighResUrl(img.getAttribute('src')),
      thumbSrc: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || img.getAttribute('data-alt') || caption,
      caption
    };
  });

  if (items.length) {
    sectionGalleries.set(groupId, { title: groupTitle, items });
  }
});

let openSectionLightbox = null;
const pageSyncers = new Map();

let siteVideoLock = false;

function syncSiteVideo(v) {
  v.muted = true;
  const isLocVideo = v.id === 'location-guide-video';
  const locPaneActive = isLocVideo ? !v.closest('.location-pane')?.hidden : true;
  const isSlideActive = isLocVideo ? locPaneActive : v.classList.contains('is-active-img');

  const shouldPlay =
    !siteVideoLock &&
    !document.hidden &&
    !v._userPaused &&
    v._inView !== false &&
    isSlideActive;
  if (shouldPlay) v.play().catch(() => {});
  else v.pause();
}

const siteVideoObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target._inView = isIntersecting;
        syncSiteVideo(target);
      });
    }, { threshold: 0.15 })
  : null;

document.querySelectorAll('.multi-media-frame > video, #location-guide-video').forEach((v) => {
  v.muted = true;
  siteVideoObserver?.observe(v);
});

document.addEventListener('visibilitychange', () => {
  document.querySelectorAll('.multi-media-frame > video, #location-guide-video').forEach(syncSiteVideo);
});

function initCenteredLoopCarousels() {
  const carousels = document.querySelectorAll('.carousel-wrapper');

  carousels.forEach((wrapper) => {
    const track = wrapper.querySelector('.carousel-track');
    const viewport = wrapper.querySelector('.carousel-viewport');
    const prevBtn = wrapper.querySelector('.prev-btn');
    const nextBtn = wrapper.querySelector('.next-btn');
    const dotsContainer = wrapper.querySelector('.carousel-dots');

    const originalSlides = Array.from(track.children);
    const total = originalSlides.length;

    const dots = [];
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ver foto ${i + 1}`);
        dot.addEventListener('click', () => {
          if (!isAnimating) moveToIndex(total + i, true);
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
      }
    }

    originalSlides.forEach((s) => track.appendChild(s.cloneNode(true)));
    originalSlides.slice().reverse().forEach((s) => track.insertBefore(s.cloneNode(true), track.firstChild));

    const allSlides = Array.from(track.children);
    let currentIndex = total;
    let isAnimating = false;

    allSlides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (!img) return;
      img.setAttribute('draggable', 'false');
      const groupId = img.getAttribute('data-group-id') || 'galeria-clube';
      const slideIdx = parseInt(img.getAttribute('data-slide-index') || '0', 10);
      const gallery = sectionGalleries.get(groupId);
      const galleryTotal = gallery ? gallery.items.length : total;

      let badge = slide.querySelector('.img-zoom-badge');
      if (!badge) {
        badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'img-zoom-badge';
        badge.setAttribute('aria-label', `Expandir foto ${slideIdx + 1} de ${galleryTotal} em tela cheia`);
        badge.textContent = `⛶ ${slideIdx + 1}/${galleryTotal}`;
        slide.appendChild(badge);
      }

      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof openSectionLightbox === 'function') {
          openSectionLightbox(groupId, slideIdx, slide);
        }
      });

      // Aplica o Zoom por Clique (Desktop) e Pinça (Mobile) a cada slide da galeria
      attachInteractiveZoom(slide, () => slide.querySelector('img'));
    });

    function getCenterOffset(index) {
      const slide = allSlides[index];
      const viewportCenter = viewport.offsetWidth / 2;
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      return viewportCenter - slideCenter;
    }

    function updateActiveState() {
      const realIdx = ((currentIndex - total) % total + total) % total;
      allSlides.forEach((s, i) => {
        if (i !== currentIndex) s._zoomController?.reset(false);
        s.classList.toggle('is-center', i === currentIndex);
        s.setAttribute('aria-hidden', String(i !== currentIndex));
      });
      dots.forEach((d, idx) => d.classList.toggle('active', idx === realIdx));
    }

    function instantJump(newIndex) {
      track.classList.add('no-transition');
      currentIndex = newIndex;
      updateActiveState();
      gsap.set(track, { x: getCenterOffset(currentIndex) });
      void track.offsetHeight;
      track.classList.remove('no-transition');
    }

    function moveToIndex(index, animate = true) {
      allSlides[currentIndex]?._zoomController?.reset(false);

      if (!animate || prefersReducedMotion) {
        let targetIdx = index;
        if (targetIdx >= total * 2) targetIdx -= total;
        else if (targetIdx < total) targetIdx += total;
        instantJump(targetIdx);
        return;
      }

      currentIndex = index;
      updateActiveState();
      const targetX = getCenterOffset(currentIndex);

      isAnimating = true;
      gsap.to(track, {
        x: targetX,
        duration: 0.65,
        ease: 'power3.out',
        onComplete: () => {
          if (currentIndex >= total * 2) {
            instantJump(currentIndex - total);
          } else if (currentIndex < total) {
            instantJump(currentIndex + total);
          }
          isAnimating = false;
        }
      });
    }

    window.addEventListener('load', () => moveToIndex(currentIndex, false));
    setTimeout(() => moveToIndex(currentIndex, false), 60);

    nextBtn?.addEventListener('click', () => {
      if (!isAnimating) moveToIndex(currentIndex + 1, true);
    });

    prevBtn?.addEventListener('click', () => {
      if (!isAnimating) moveToIndex(currentIndex - 1, true);
    });

    viewport?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextBtn?.click();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevBtn?.click();
      }
    });

    let startX = 0;
    let startY = 0;
    let lastDragDistance = 0;
    let isDragging = false;

    viewport?.addEventListener('pointerdown', (e) => {
      const centerSlide = allSlides[currentIndex];
      if (centerSlide?._zoomController?.isZoomed()) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      lastDragDistance = 0;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const centerSlide = allSlides[currentIndex];
      if (centerSlide?._zoomController?.isZoomed()) return;

      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      lastDragDistance = Math.hypot(diffX, diffY);
      if (centerSlide) centerSlide._lastSwipeDist = lastDragDistance;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
        if (diffX < 0) nextBtn?.click();
        else prevBtn?.click();
      }
    });

    window.addEventListener('pointercancel', () => {
      isDragging = false;
    });

    allSlides.forEach((slide, idx) => {
      slide.addEventListener('click', (e) => {
        if (e.target.closest('.img-zoom-badge')) return;
        const moveDist = lastDragDistance || Math.hypot(e.clientX - startX, e.clientY - startY);
        if (startX !== 0 && moveDist > 12) return;
        if (isAnimating) return;

        if (idx !== currentIndex) {
          moveToIndex(idx, true);
        }
      });
    });

    window.addEventListener('resize', () => moveToIndex(currentIndex, false));

    const wrapperGroupId = wrapper.getAttribute('data-gallery-group');
    if (wrapperGroupId) {
      pageSyncers.set(wrapperGroupId, (realIdx) => {
        const target = ((realIdx % total) + total) % total;
        const current = (((currentIndex - total) % total) + total) % total;
        if (target === current) return;
        gsap.killTweensOf(track);
        isAnimating = false;
        moveToIndex(total + target, false);
      });
    }
  });
}

initCenteredLoopCarousels();

function initSiteImageLightbox() {
  const modal = document.getElementById('image-lightbox');
  const dialog = document.getElementById('lightbox-dialog');
  const stage = document.getElementById('lightbox-stage');
  const modalImg = document.getElementById('lightbox-img');
  const modalVideo = document.getElementById('lightbox-video');
  const modalGroupTitle = document.getElementById('lightbox-group-title');
  const modalCaption = document.getElementById('lightbox-caption');
  const modalCounter = document.getElementById('lightbox-counter');
  const modalThumbs = document.getElementById('lightbox-thumbs');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const fsBtn = document.getElementById('lightbox-fs-btn');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const backdrop = modal?.querySelector('[data-lightbox-close]');

  if (!modal || !modalImg) return;

  let currentGroupId = null;
  let activeIdx = 0;
  let lastTriggerEl = null;

  const lightboxPlayer = stage && modalVideo ? createVideoPlayerController(stage, modalVideo) : null;
  if (lightboxPlayer) lightboxPlayer.setVisible(false);

  // Ativa Zoom por Clique (Desktop) e Pinça (Mobile) também dentro do Lightbox
  const stageZoom = attachInteractiveZoom(stage, () => (!modalImg.hidden ? modalImg : null));

  let modalDragStartX = 0;
  let modalDragStartY = 0;
  let modalDragDist = 0;
  let isModalDragging = false;

  modalVideo?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (modalDragDist > 12) return;
    modalVideo.muted = true;
    if (modalVideo.paused) modalVideo.play().catch(() => {});
    else modalVideo.pause();
    lightboxPlayer?.syncUI();
  });

  stage?.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.lightbox-nav-btn, .custom-video-player')) return;
    if (stageZoom?.isZoomed()) return;
    isModalDragging = true;
    modalDragStartX = e.clientX;
    modalDragStartY = e.clientY;
    modalDragDist = 0;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isModalDragging) return;
    isModalDragging = false;
    if (!modal.classList.contains('is-open')) return;
    if (stageZoom?.isZoomed()) return;

    const diffX = e.clientX - modalDragStartX;
    const diffY = e.clientY - modalDragStartY;
    modalDragDist = Math.hypot(diffX, diffY);
    if (stage) stage._lastSwipeDist = modalDragDist;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) renderLightboxSlide(activeIdx + 1, 1);
      else renderLightboxSlide(activeIdx - 1, -1);
    }
  });

  window.addEventListener('pointercancel', () => {
    isModalDragging = false;
  });

  function releaseModalVideo() {
    if (!modalVideo) return;
    const src = modalVideo._srcEl;
    if (src) {
      if (isFinite(modalVideo.currentTime)) {
        try { src.currentTime = modalVideo.currentTime; } catch (e) {}
      }
      src.playbackRate = modalVideo.playbackRate || 1;
    }
    modalVideo._srcEl = null;
    modalVideo.pause();
    lightboxPlayer?.setVisible(false);
  }

  function pauseSiteVideos() {
    siteVideoLock = true;
    document.querySelectorAll('.multi-media-frame > video, #location-guide-video').forEach((v) => v.pause());
  }

  function resumeSiteVideos() {
    siteVideoLock = false;
    document.querySelectorAll('.multi-media-frame > video, #location-guide-video').forEach(syncSiteVideo);
  }

  function renderLightboxSlide(index, direction = 0) {
    const gallery = sectionGalleries.get(currentGroupId);
    if (!gallery || !gallery.items.length) return;

    stageZoom?.reset(false);

    const total = gallery.items.length;
    activeIdx = ((index % total) + total) % total;
    const item = gallery.items[activeIdx];

    pageSyncers.get(currentGroupId)?.(activeIdx);

    if (modalGroupTitle) modalGroupTitle.textContent = gallery.title;
    const isVideo = item.type === 'video' && !!modalVideo;
    const activeEl = isVideo ? modalVideo : modalImg;
    if (modalVideo) {
      releaseModalVideo();
      if (isVideo) {
        const srcEl = item.el;
        const url = (srcEl && srcEl.getAttribute('src')) || item.src;
        const startAt = srcEl ? srcEl.currentTime : 0;
        const startRate = srcEl ? (srcEl.playbackRate || 1) : 1;
        modalVideo._srcEl = srcEl || null;
        if (srcEl) srcEl.pause();
        modalVideo.hidden = false;
        modalVideo.muted = true;
        modalVideo.playbackRate = startRate;
        lightboxPlayer?.setVisible(true);

        const startPlayback = () => {
          try { modalVideo.currentTime = startAt; } catch (e) {}
          modalVideo.muted = true;
          modalVideo.playbackRate = startRate;
          modalVideo.play().catch(() => {});
          lightboxPlayer?.syncUI();
        };

        if (modalVideo.getAttribute('src') !== url) {
          modalVideo.addEventListener('loadedmetadata', startPlayback, { once: true });
          modalVideo.setAttribute('src', url);
        } else if (modalVideo.readyState >= 1) {
          startPlayback();
        } else {
          modalVideo.addEventListener('loadedmetadata', startPlayback, { once: true });
        }
      } else {
        modalVideo.hidden = true;
        lightboxPlayer?.setVisible(false);
      }
    }
    modalImg.hidden = isVideo;
    if (!isVideo) {
      modalImg.src = item.src;
      modalImg.alt = item.alt;
    }
    if (modalCaption) modalCaption.textContent = item.caption;
    if (modalCounter) {
      modalCounter.textContent = `${String(activeIdx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    }

    if (modalThumbs) {
      const thumbBtns = Array.from(modalThumbs.querySelectorAll('.lightbox-thumb-btn'));
      thumbBtns.forEach((btn, idx) => {
        const isCurrent = idx === activeIdx;
        btn.classList.toggle('is-active', isCurrent);
        btn.setAttribute('aria-selected', String(isCurrent));
        if (isCurrent) {
          btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      });
    }

    if (!prefersReducedMotion) {
      const fromX = direction > 0 ? 28 : direction < 0 ? -28 : 0;
      gsap.fromTo(
        activeEl,
        { x: fromX, scale: 0.98, opacity: 0 },
        { x: 0, scale: 1, opacity: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }

  function buildLightboxThumbnails(groupId) {
    if (!modalThumbs) return;
    modalThumbs.innerHTML = '';
    const gallery = sectionGalleries.get(groupId);
    if (!gallery) return;

    gallery.items.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox-thumb-btn' + (idx === activeIdx ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Ver ângulo ${idx + 1}: ${item.caption}`);
      btn.setAttribute('aria-selected', String(idx === activeIdx));

      if (item.type === 'video') {
        btn.classList.add('is-video');
        const tVid = document.createElement('video');
        tVid.src = item.thumbSrc + '#t=0.1';
        tVid.muted = true;
        tVid.preload = 'metadata';
        tVid.playsInline = true;
        btn.appendChild(tVid);
      } else {
        const tImg = document.createElement('img');
        tImg.src = item.thumbSrc;
        tImg.alt = '';
        tImg.loading = 'lazy';
        tImg.setAttribute('draggable', 'false');
        btn.appendChild(tImg);
      }

      btn.addEventListener('click', () => {
        const dir = idx > activeIdx ? 1 : idx < activeIdx ? -1 : 0;
        renderLightboxSlide(idx, dir);
      });
      modalThumbs.appendChild(btn);
    });
  }

  function openLightbox(groupId, index = 0, triggerEl = null) {
    if (!sectionGalleries.has(groupId)) return;
    currentGroupId = groupId;
    lastTriggerEl = triggerEl;
    activeIdx = index;
    pauseSiteVideos();
    buildLightboxThumbnails(groupId);
    renderLightboxSlide(index, 0);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    window.setTimeout(() => closeBtn?.focus(), 40);
  }

  openSectionLightbox = openLightbox;

  function closeLightbox() {
    if (!modal.classList.contains('is-open')) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    stageZoom?.reset(false);
    modal.classList.remove('is-open');
    releaseModalVideo();
    resumeSiteVideos();
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
      lastTriggerEl.focus();
    }
  }

  function toggleNativeFullscreen() {
    if (!dialog) return;
    if (!document.fullscreenElement) {
      dialog.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const label = fsBtn?.querySelector('.fs-label');
    if (label) {
      label.textContent = document.fullscreenElement ? '⛶ SAIR DA TELA CHEIA' : '⛶ TELA CHEIA';
    }
  });

  document.querySelectorAll('.multi-media-frame').forEach((frame) => {
    const groupId = frame.getAttribute('data-gallery-group');
    const imgs = Array.from(frame.querySelectorAll(':scope > img, :scope > video'));
    if (!groupId || !imgs.length) return;

    const total = imgs.length;
    const MAX_VISIBLE_DOTS = 3;
    let currentFrameIdx = 0;

    frame.classList.add('zoomable-media');

    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'img-zoom-badge';
    badge.setAttribute('aria-label', `Expandir mídia em tela cheia (1 de ${total})`);
    badge.textContent = `⛶ 1/${total}`;
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(groupId, currentFrameIdx, frame);
    });
    frame.appendChild(badge);

    const frameVideo = imgs.find((el) => el.tagName === 'VIDEO');
    const framePlayer = frameVideo ? createVideoPlayerController(frame, frameVideo) : null;

    // Conecta o Zoom Interativo (Clique Desktop + Pinça Mobile) ao frame multimídia
    const frameZoom = attachInteractiveZoom(frame, () => {
      const activeEl = imgs[currentFrameIdx];
      return activeEl && activeEl.tagName === 'IMG' ? activeEl : null;
    });

    const dots = [];
    let moreBadge = null;

    if (total > 1) {
      const controls = document.createElement('div');
      controls.className = 'frame-mini-controls';

      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'frame-mini-dots';

      const visibleCount = Math.min(total, MAX_VISIBLE_DOTS);
      for (let i = 0; i < visibleCount; i++) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'frame-mini-dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('aria-label', `Alternar para mídia ${i + 1}`);
        d.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetSlide = Number(d.dataset.slideIdx ?? i);
          setFrameSlide(targetSlide);
        });
        dotsWrap.appendChild(d);
        dots.push(d);
      }

      if (total > MAX_VISIBLE_DOTS) {
        const extraCount = total - MAX_VISIBLE_DOTS;
        moreBadge = document.createElement('button');
        moreBadge.type = 'button';
        moreBadge.className = 'frame-mini-more';
        moreBadge.textContent = `+${extraCount}`;
        moreBadge.setAttribute('aria-label', `Mais ${extraCount} mídias. Clique para avançar`);
        moreBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          setFrameSlide(currentFrameIdx + 1);
        });
        dotsWrap.appendChild(moreBadge);
      }

      const arrowsWrap = document.createElement('div');
      arrowsWrap.className = 'frame-mini-arrows';

      const prevMini = document.createElement('button');
      prevMini.type = 'button';
      prevMini.className = 'frame-mini-nav prev';
      prevMini.setAttribute('aria-label', 'Mídia anterior deste ambiente');
      prevMini.innerHTML = '<span>‹</span>';
      prevMini.addEventListener('click', (e) => {
        e.stopPropagation();
        setFrameSlide(currentFrameIdx - 1);
      });

      const nextMini = document.createElement('button');
      nextMini.type = 'button';
      nextMini.className = 'frame-mini-nav next';
      nextMini.setAttribute('aria-label', 'Próxima mídia deste ambiente');
      nextMini.innerHTML = '<span>›</span>';
      nextMini.addEventListener('click', (e) => {
        e.stopPropagation();
        setFrameSlide(currentFrameIdx + 1);
      });

      arrowsWrap.appendChild(prevMini);
      arrowsWrap.appendChild(nextMini);

      controls.appendChild(dotsWrap);
      controls.appendChild(arrowsWrap);
      frame.appendChild(controls);
    }

    function syncCompactDots() {
      if (!dots.length) return;
      if (total <= MAX_VISIBLE_DOTS) {
        dots.forEach((d, idx) => {
          d.dataset.slideIdx = String(idx);
          d.classList.toggle('is-active', idx === currentFrameIdx);
        });
        return;
      }

      const windowStart = Math.max(0, Math.min(currentFrameIdx - 1, total - MAX_VISIBLE_DOTS));
      dots.forEach((d, slotIdx) => {
        const mappedIdx = windowStart + slotIdx;
        d.dataset.slideIdx = String(mappedIdx);
        d.setAttribute('aria-label', `Alternar para mídia ${mappedIdx + 1}`);
        d.classList.toggle('is-active', mappedIdx === currentFrameIdx);
      });

      if (moreBadge) {
        const remaining = total - MAX_VISIBLE_DOTS;
        moreBadge.textContent = `+${remaining}`;
        moreBadge.classList.toggle('is-active', currentFrameIdx >= MAX_VISIBLE_DOTS);
      }
    }

    function updateFrameVideoUI() {
      const activeEl = imgs[currentFrameIdx];
      const isVideoActive = activeEl && activeEl.tagName === 'VIDEO';
      frame.classList.toggle('has-active-video', Boolean(isVideoActive));
      if (framePlayer) {
        if (isVideoActive) {
          framePlayer.attachVideo(activeEl);
          framePlayer.setVisible(true);
        } else {
          framePlayer.setVisible(false);
        }
      }
    }

    function setFrameSlide(newIdx) {
      frameZoom?.reset(false);
      currentFrameIdx = ((newIdx % total) + total) % total;
      imgs.forEach((im, idx) => {
        const on = idx === currentFrameIdx;
        im.classList.toggle('is-active-img', on);
        if (im.tagName === 'VIDEO') syncSiteVideo(im);
      });
      syncCompactDots();
      badge.textContent = `⛶ ${currentFrameIdx + 1}/${total}`;
      badge.setAttribute('aria-label', `Expandir mídia em tela cheia (${currentFrameIdx + 1} de ${total})`);
      updateFrameVideoUI();
    }

    syncCompactDots();
    updateFrameVideoUI();

    let frameStartX = 0;
    let frameStartY = 0;
    let frameDragDist = 0;
    let isFrameDragging = false;

    frame.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.frame-mini-controls, .custom-video-player, .img-zoom-badge')) return;
      if (frameZoom?.isZoomed()) return;
      isFrameDragging = true;
      frameStartX = e.clientX;
      frameStartY = e.clientY;
      frameDragDist = 0;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isFrameDragging) return;
      isFrameDragging = false;
      if (frameZoom?.isZoomed()) return;

      const diffX = e.clientX - frameStartX;
      const diffY = e.clientY - frameStartY;
      frameDragDist = Math.hypot(diffX, diffY);
      frame._lastSwipeDist = frameDragDist;

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
        if (diffX < 0) setFrameSlide(currentFrameIdx + 1);
        else setFrameSlide(currentFrameIdx - 1);
      }
    });

    window.addEventListener('pointercancel', () => {
      isFrameDragging = false;
    });

    pageSyncers.set(groupId, (idx) => {
      const target = ((idx % total) + total) % total;
      if (target !== currentFrameIdx) setFrameSlide(target);
    });

    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'region');
    frame.setAttribute('aria-label', `Galeria interativa (${total} mídias): ${frame.getAttribute('data-gallery-title') || ''}`);

    // Se o elemento ativo for vídeo, clicar nele alterna Play/Pause
    frame.addEventListener('click', (e) => {
      if (e.target.closest('.frame-mini-controls, .custom-video-player, .img-zoom-badge')) return;
      const moveDist = frameDragDist || Math.hypot(e.clientX - frameStartX, e.clientY - frameStartY);
      if (frameStartX !== 0 && moveDist > 12) return;

      const activeEl = imgs[currentFrameIdx];
      if (activeEl && activeEl.tagName === 'VIDEO') {
        activeEl.muted = true;
        if (activeEl.paused) {
          activeEl._userPaused = false;
          activeEl.play().catch(() => {});
        } else {
          activeEl._userPaused = true;
          activeEl.pause();
        }
        framePlayer?.syncUI();
      }
    });

    frame.addEventListener('keydown', (e) => {
      if (e.target.closest('.custom-video-player')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(groupId, currentFrameIdx, frame);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFrameSlide(currentFrameIdx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFrameSlide(currentFrameIdx - 1);
      }
    });
  });

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);
  fsBtn?.addEventListener('click', toggleNativeFullscreen);
  prevBtn?.addEventListener('click', () => renderLightboxSlide(activeIdx - 1, -1));
  nextBtn?.addEventListener('click', () => renderLightboxSlide(activeIdx + 1, 1));

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === ' ' && modalVideo && !modalVideo.hidden) {
      e.preventDefault();
      modalVideo.muted = true;
      if (modalVideo.paused) modalVideo.play().catch(() => {});
      else modalVideo.pause();
      lightboxPlayer?.syncUI();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      renderLightboxSlide(activeIdx + 1, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      renderLightboxSlide(activeIdx - 1, -1);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleNativeFullscreen();
    }
  });
}

initSiteImageLightbox();

// ==========================================================
// SEÇÃO DE LOCALIZAÇÃO — VÍDEO "COMO CHEGAR" + MAPA
// ==========================================================
function initLocationMediaSwitcher() {
  const videoTab = document.getElementById('tab-loc-video');
  const mapTab = document.getElementById('tab-loc-map');
  const videoPane = document.getElementById('loc-pane-video');
  const mapPane = document.getElementById('loc-pane-map');
  const locVideo = document.getElementById('location-guide-video');
  const openVideoCta = document.getElementById('open-location-video-cta');
  const expandVideoBtn = document.getElementById('location-video-expand-btn');

  if (!mapTab || !videoTab || !mapPane || !videoPane) return;

  const locPlayer = locVideo ? createVideoPlayerController(videoPane, locVideo) : null;

  let locDragStartX = 0;
  let locDragStartY = 0;
  let locDragDist = 0;
  let isLocDragging = false;

  locVideo?.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.custom-video-player, .img-zoom-badge')) return;
    isLocDragging = true;
    locDragStartX = e.clientX;
    locDragStartY = e.clientY;
    locDragDist = 0;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isLocDragging) return;
    isLocDragging = false;
    const diffX = e.clientX - locDragStartX;
    const diffY = e.clientY - locDragStartY;
    locDragDist = Math.hypot(diffX, diffY);

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      switchLocationView('map', false);
    }
  });

  window.addEventListener('pointercancel', () => {
    isLocDragging = false;
  });

  locVideo?.addEventListener('click', (e) => {
    if (e.target.closest('.custom-video-player, .img-zoom-badge')) return;
    if (locDragDist > 12) return;
    e.stopPropagation();
    locVideo.muted = true;
    if (locVideo.paused) {
      locVideo._userPaused = false;
      locVideo.play().catch(() => {});
    } else {
      locVideo._userPaused = true;
      locVideo.pause();
    }
    locPlayer?.syncUI();
  });

  expandVideoBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof openSectionLightbox === 'function') {
      openSectionLightbox('localizacao-video', 0, expandVideoBtn);
    }
  });

  function switchLocationView(view, shouldFocus = false) {
    const showVideo = view === 'video';
    videoTab.classList.toggle('active', showVideo);
    videoTab.setAttribute('aria-selected', String(showVideo));
    mapTab.classList.toggle('active', !showVideo);
    mapTab.setAttribute('aria-selected', String(!showVideo));

    videoPane.hidden = !showVideo;
    mapPane.hidden = showVideo;
    videoPane.classList.toggle('is-active', showVideo);
    mapPane.classList.toggle('is-active', !showVideo);

    if (locVideo) {
      locVideo.muted = true;
      if (showVideo) {
        locVideo._userPaused = false;
        syncSiteVideo(locVideo);
        locPlayer?.syncUI();
      } else {
        locVideo.pause();
      }
    }

    if (shouldFocus) {
      (showVideo ? videoTab : mapTab).focus();
    }
  }

  videoTab.addEventListener('click', () => switchLocationView('video'));
  mapTab.addEventListener('click', () => switchLocationView('map'));

  openVideoCta?.addEventListener('click', () => {
    switchLocationView('video', false);
    videoPane.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  switchLocationView('map', false);
}

initLocationMediaSwitcher();

function setupTabs(tabs, panels, getTargetId, animatePanel) {
  function activate(tab, focus = false, shouldAnimate = true) {
    tabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((p) => p.classList.remove('active'));

    const panel = document.getElementById(getTargetId(tab));
    if (panel) {
      panel.classList.add('active');
      if (shouldAnimate && !prefersReducedMotion) animatePanel(panel);
    }
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab, false, true));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      let next = null;
      if (step) next = tabs[(i + step + tabs.length) % tabs.length];
      else if (event.key === 'Home') next = tabs[0];
      else if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        event.preventDefault();
        activate(next, true, true);
      }
    });
  });

  return activate;
}

setupTabs(
  Array.from(document.querySelectorAll('.event-tab')),
  Array.from(document.querySelectorAll('.event-content')),
  (tab) => tab.getAttribute('data-target'),
  (panel) => {
    gsap.killTweensOf(panel);
    gsap.fromTo(panel, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.26, ease: 'power2.out' });
  }
);

const dayPillsList = Array.from(document.querySelectorAll('.day-pill'));
const activateDayTab = setupTabs(
  dayPillsList,
  Array.from(document.querySelectorAll('.schedule-day-group')),
  (tab) => tab.getAttribute('data-day'),
  (panel) => {
    const rows = panel.querySelectorAll('.time-row');
    gsap.killTweensOf(rows);
    gsap.fromTo(rows, { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, stagger: 0.05, ease: 'power2.out' });
  }
);

function initClubLiveStatus() {
  const scheduleBadge = document.getElementById('club-live-status');
  const headerBadge = document.getElementById('header-live-status');

  function updateStatus(autoSelectTab = false) {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);

    const map = {};
    parts.forEach((p) => { map[p.type] = p.value; });

    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = dayMap[map.weekday] ?? now.getDay();
    const mins = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);

    if (autoSelectTab && dayPillsList.length) {
      let targetDayKey = 'seg-qua-sex';
      if (day === 2 || day === 4) targetDayKey = 'ter-qui';
      else if (day === 6) targetDayKey = 'sabado';
      const matchingPill = dayPillsList.find((p) => p.getAttribute('data-day') === targetDayKey);
      if (matchingPill && !matchingPill.classList.contains('active')) {
        activateDayTab(matchingPill, false, false);
      }
    }

    let isOpen = false;
    let isBreak = false;
    let statusMessage = '';

    if (day === 1 || day === 3 || day === 5) {
      if (mins >= 900 && mins < 1320) {
        isOpen = true;
        statusMessage = 'ABERTO AGORA • FUNCIONAMENTO ATÉ 22H00';
      } else if (mins < 900) {
        statusMessage = 'FECHADO AGORA • ABRE HOJE ÀS 15H00';
      } else {
        statusMessage = day === 5
          ? 'FECHADO AGORA • ABRE SÁBADO ÀS 08H00'
          : 'FECHADO AGORA • ABRE AMANHÃ ÀS 09H30';
      }
    } else if (day === 2 || day === 4) {
      if (mins >= 570 && mins < 720) {
        isOpen = true;
        statusMessage = 'ABERTO AGORA • TURNO DA MANHÃ ATÉ 12H00';
      } else if (mins >= 930 && mins < 1320) {
        isOpen = true;
        statusMessage = 'ABERTO AGORA • FUNCIONAMENTO ATÉ 22H00';
      } else if (mins < 570) {
        statusMessage = 'FECHADO AGORA • ABRE HOJE ÀS 09H30';
      } else if (mins >= 720 && mins < 930) {
        isBreak = true;
        statusMessage = 'INTERVALO ENTRE TURNOS • REABRE HOJE ÀS 15H30';
      } else {
        statusMessage = 'FECHADO AGORA • ABRE AMANHÃ ÀS 15H00';
      }
    } else if (day === 6) {
      if (mins >= 480 && mins < 720) {
        isOpen = true;
        statusMessage = 'ABERTO AGORA • SÁBADO ATÉ 12H00';
      } else if (mins < 480) {
        statusMessage = 'FECHADO AGORA • ABRE HOJE ÀS 08H00';
      } else {
        statusMessage = 'FECHADO AGORA • ABRE SEGUNDA ÀS 15H00';
      }
    } else {
      statusMessage = 'FECHADO HOJE • ABRE SEGUNDA ÀS 15H00';
    }

    [scheduleBadge, headerBadge].forEach((badge) => {
      if (!badge) return;
      badge.classList.toggle('is-open', isOpen);
      badge.classList.toggle('is-break', isBreak);
      const txt = badge.querySelector('.status-text');
      if (txt) txt.textContent = statusMessage;
    });
  }

  updateStatus(true);
  window.setInterval(() => updateStatus(false), 30000);
}

initClubLiveStatus();

const faqItems = Array.from(document.querySelectorAll('.faq-item'));

function closeFaqItem(details, animDuration) {
  const summary = details.querySelector('summary');
  const contentWrap = details.querySelector('.faq-content-wrap');
  if (!summary || !contentWrap) return;

  summary.setAttribute('aria-expanded', 'false');
  details.classList.remove('is-expanding');
  details.classList.add('is-closing');

  gsap.to(contentWrap, {
    height: 0,
    opacity: 0,
    duration: animDuration,
    ease: 'power2.inOut',
    onComplete: () => {
      details.removeAttribute('open');
      details.classList.remove('is-closing');
      ScrollTrigger.refresh();
    }
  });
}

faqItems.forEach((details) => {
  const summary = details.querySelector('summary');
  const contentWrap = details.querySelector('.faq-content-wrap');
  const innerP = contentWrap?.querySelector('p');

  if (!summary || !contentWrap || !innerP) return;

  summary.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = details.hasAttribute('open') && !details.classList.contains('is-closing');
    const animDuration = prefersReducedMotion ? 0 : 0.28;

    if (isOpen) {
      closeFaqItem(details, animDuration);
    } else {
      faqItems.forEach((other) => {
        if (other !== details && other.hasAttribute('open')) {
          closeFaqItem(other, animDuration);
        }
      });

      details.classList.remove('is-closing');
      details.classList.add('is-expanding');
      details.setAttribute('open', '');
      summary.setAttribute('aria-expanded', 'true');

      const targetHeight = innerP.offsetHeight;
      gsap.fromTo(
        contentWrap,
        { height: 0, opacity: 0 },
        {
          height: targetHeight,
          opacity: 1,
          duration: animDuration,
          ease: 'power2.out',
          onComplete: () => {
            details.classList.remove('is-expanding');
            gsap.set(contentWrap, { height: 'auto' });
            ScrollTrigger.refresh();
          }
        }
      );
    }
  });
});

if (!prefersReducedMotion) {
  const isDesktopNav = window.matchMedia('(min-width: 1181px)').matches;
  const navbarItemsSelector = isDesktopNav
    ? '.navbar-grid > .nav-brand, .navbar-grid .nav-links > li, .navbar-grid > .nav-actions'
    : '.navbar-grid > .nav-brand, .navbar-grid > .nav-actions';

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .fromTo(
      '#navbar',
      { y: -24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        onComplete() {
          if (navbar) navbar.style.transform = 'translateZ(0)';
        }
      }
    )
    .fromTo(
      '#navbar .club-topbar',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, clearProps: 'transform,opacity' },
      '-=0.38'
    )
    .fromTo(
      navbarItemsSelector,
      { y: -14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.48, stagger: 0.04, clearProps: 'transform,opacity' },
      '-=0.35'
    )
    .fromTo(
      '.hero-headline-box',
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      '-=0.45'
    )
    .fromTo(
      '.gs-hero-line',
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.72, stagger: 0.09 },
      '-=0.4'
    )
    .fromTo(
      '.gs-hero-meta',
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.08 },
      '-=0.45'
    )
    .fromTo(
      '.hero-right',
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65 },
      '-=0.5'
    );

  const scrollBlocksSelector = [
    '.section-void-divider',
    '.trial-spotlight-bar',
    '.section-index-bar',
    '.trial-guide-board',
    '.gs-scroll-fade',
    '.gs-scroll-row',
    '.site-footer'
  ].join(', ');

  const scrollBlocks = gsap.utils.toArray(scrollBlocksSelector);

  scrollBlocks.forEach((block) => {
    const isCompactBar = block.matches('.section-void-divider, .trial-spotlight-bar, .section-index-bar');
    const startOffset = isCompactBar ? 14 : 28;
    const animDuration = isCompactBar ? 0.45 : 0.62;

    gsap.fromTo(
      block,
      { y: startOffset, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: animDuration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: block,
          start: 'top 91%',
          toggleActions: 'play none none none'
        },
        onComplete() {
          block.style.transform = '';
        }
      }
    );
  });

  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}

(function initResponsiveVideoSource() {
  const mq = window.matchMedia('(max-width: 680px), (orientation: portrait) and (max-width: 900px)');
  const videos = document.querySelectorAll('video[data-src-mobile]');
  if (!videos.length) return;

  function apply() {
    videos.forEach((v) => {
      if (!v.dataset.srcDesktop) v.dataset.srcDesktop = v.getAttribute('src') || '';
      const wanted = mq.matches ? v.dataset.srcMobile : v.dataset.srcDesktop;
      if (wanted && v.getAttribute('src') !== wanted) {
        v.setAttribute('src', wanted);
        v.muted = true;
        v.load();
        v.play().catch(() => {});
      }
    });
  }

  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
  else mq.addListener(apply);
})();