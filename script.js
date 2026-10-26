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

document.querySelectorAll('.btn-brutal-primary, .btn-brutal-secondary, .carousel-btn, .day-pill, .event-tab, .off-cta-link, .time-action, .lightbox-action-btn, .lightbox-nav-btn').forEach((btn) => {
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

// groupId -> função que move o carrossel/frame da página para o índice informado
const pageSyncers = new Map();

// ---- Vídeos do site: só tocam quando estão visíveis, ativos e sem lightbox aberto ----
let siteVideoLock = false;

function syncSiteVideo(v) {
  const shouldPlay =
    !siteVideoLock &&
    !document.hidden &&
    v._inView !== false &&
    v.classList.contains('is-active-img');
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

document.querySelectorAll('.multi-media-frame > video').forEach((v) => {
  siteVideoObserver?.observe(v);
});

document.addEventListener('visibilitychange', () => {
  document.querySelectorAll('.multi-media-frame > video').forEach(syncSiteVideo);
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

      if (!slide.querySelector('.img-zoom-badge')) {
        const badge = document.createElement('span');
        badge.className = 'img-zoom-badge';
        badge.setAttribute('aria-hidden', 'true');
        badge.textContent = `⛶ ${slideIdx + 1}/${galleryTotal}`;
        slide.appendChild(badge);
      }
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
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      lastDragDistance = 0;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      lastDragDistance = Math.hypot(diffX, diffY);

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
        const moveDist = lastDragDistance || Math.hypot(e.clientX - startX, e.clientY - startY);
        if (startX !== 0 && moveDist > 12) return;
        if (isAnimating) return;

        if (idx !== currentIndex) {
          moveToIndex(idx, true);
          return;
        }

        const img = slide.querySelector('img');
        if (!img || typeof openSectionLightbox !== 'function') return;
        const groupId = img.getAttribute('data-group-id') || 'galeria-clube';
        const slideIdx = parseInt(img.getAttribute('data-slide-index') || '0', 10);
        openSectionLightbox(groupId, slideIdx, slide);
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

  // Devolve o tempo do vídeo ampliado para o vídeo do site (sem retomar a reprodução dele)
  function releaseModalVideo() {
    if (!modalVideo) return;
    const src = modalVideo._srcEl;
    if (src) {
      if (isFinite(modalVideo.currentTime)) {
        try { src.currentTime = modalVideo.currentTime; } catch (e) {}
      }
    }
    modalVideo._srcEl = null;
    modalVideo.pause();
  }

  function pauseSiteVideos() {
    siteVideoLock = true;
    document.querySelectorAll('.multi-media-frame > video').forEach((v) => v.pause());
  }

  function resumeSiteVideos() {
    siteVideoLock = false;
    document.querySelectorAll('.multi-media-frame > video').forEach(syncSiteVideo);
  }

  function renderLightboxSlide(index, direction = 0) {
    const gallery = sectionGalleries.get(currentGroupId);
    if (!gallery || !gallery.items.length) return;

    const total = gallery.items.length;
    activeIdx = ((index % total) + total) % total;
    const item = gallery.items[activeIdx];

    // mantém a mídia da página igual à que está aberta no lightbox
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
        modalVideo._srcEl = srcEl || null;
        if (srcEl) srcEl.pause();
        modalVideo.hidden = false;

        const startPlayback = () => {
          try { modalVideo.currentTime = startAt; } catch (e) {}
          modalVideo.play().catch(() => {});
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

  let modalDragStartX = 0;
  let modalDragStartY = 0;
  let isModalDragging = false;

  stage?.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.lightbox-nav-btn')) return;
    isModalDragging = true;
    modalDragStartX = e.clientX;
    modalDragStartY = e.clientY;
  });

  window.addEventListener('pointerup', (e) => {
    if (!isModalDragging) return;
    isModalDragging = false;
    if (!modal.classList.contains('is-open')) return;

    const diffX = e.clientX - modalDragStartX;
    const diffY = e.clientY - modalDragStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) renderLightboxSlide(activeIdx + 1, 1);
      else renderLightboxSlide(activeIdx - 1, -1);
    }
  });

  window.addEventListener('pointercancel', () => {
    isModalDragging = false;
  });

  document.querySelectorAll('.multi-media-frame').forEach((frame) => {
    const groupId = frame.getAttribute('data-gallery-group');
    const imgs = Array.from(frame.querySelectorAll(':scope > img, :scope > video'));
    if (!groupId || !imgs.length) return;

    const total = imgs.length;
    let currentFrameIdx = 0;

    frame.classList.add('zoomable-media');

    const badge = document.createElement('span');
    badge.className = 'img-zoom-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = `⛶ 1/${total}`;
    frame.appendChild(badge);

    const dots = [];

    if (total > 1) {
      const controls = document.createElement('div');
      controls.className = 'frame-mini-controls';

      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'frame-mini-dots';
      for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'frame-mini-dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('aria-label', `Alternar para mídia ${i + 1}`);
        d.addEventListener('click', (e) => {
          e.stopPropagation();
          setFrameSlide(i);
        });
        dotsWrap.appendChild(d);
        dots.push(d);
      }

      const arrowsWrap = document.createElement('div');
      arrowsWrap.className = 'frame-mini-arrows';

      const prevMini = document.createElement('button');
      prevMini.type = 'button';
      prevMini.className = 'frame-mini-nav prev';
      prevMini.setAttribute('aria-label', 'Foto anterior deste ambiente');
      prevMini.innerHTML = '<span>‹</span>';
      prevMini.addEventListener('click', (e) => {
        e.stopPropagation();
        setFrameSlide(currentFrameIdx - 1);
      });

      const nextMini = document.createElement('button');
      nextMini.type = 'button';
      nextMini.className = 'frame-mini-nav next';
      nextMini.setAttribute('aria-label', 'Próxima foto deste ambiente');
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

    function setFrameSlide(newIdx) {
      currentFrameIdx = ((newIdx % total) + total) % total;
      imgs.forEach((im, idx) => {
        const on = idx === currentFrameIdx;
        im.classList.toggle('is-active-img', on);
        if (im.tagName === 'VIDEO') syncSiteVideo(im);
      });
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === currentFrameIdx));
      badge.textContent = `⛶ ${currentFrameIdx + 1}/${total}`;
    }

    let frameStartX = 0;
    let frameStartY = 0;
    let frameDragDist = 0;
    let isFrameDragging = false;

    frame.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.frame-mini-controls')) return;
      isFrameDragging = true;
      frameStartX = e.clientX;
      frameStartY = e.clientY;
      frameDragDist = 0;
    });

    window.addEventListener('pointerup', (e) => {
      if (!isFrameDragging) return;
      isFrameDragging = false;
      const diffX = e.clientX - frameStartX;
      const diffY = e.clientY - frameStartY;
      frameDragDist = Math.hypot(diffX, diffY);

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
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', `Abrir galeria desta seção (${total} fotos): ${frame.getAttribute('data-gallery-title') || ''}`);

    frame.addEventListener('click', (e) => {
      if (e.target.closest('.frame-mini-controls')) return;
      const moveDist = frameDragDist || Math.hypot(e.clientX - frameStartX, e.clientY - frameStartY);
      if (frameStartX !== 0 && moveDist > 12) return;
      openLightbox(groupId, currentFrameIdx, frame);
    });

    frame.addEventListener('keydown', (e) => {
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

/* Vídeo vertical no mobile (opcional): se o <video> tiver data-src-mobile,
   ele é usado em telas estreitas/retrato; caso contrário, nada muda. */
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
        v.load();
        v.play().catch(() => {});
      }
    });
  }

  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
  else mq.addListener(apply);
})();
