'use strict';

(function () {

  // ==================== THEME TOGGLE ====================

  /**
   * Manages the 3-state theme cycle: system -> light -> dark -> system.
   * Reads initial state from localStorage key 'dn-theme'.
   * Syncs icon visibility with the active theme at all times.
   *
   * Possible localStorage values:
   *   null  - system (follow prefers-color-scheme)
   *   'light' - force light
   *   'dark'  - force dark
   */

  var themeToggleBtn = document.querySelector('#theme-toggle');
  var sunIcon        = document.querySelector('.theme-icon-sun');
  var moonIcon       = document.querySelector('.theme-icon-moon');
  var systemIcon     = document.querySelector('.theme-icon-system');

  /**
   * Returns the current theme preference stored in localStorage.
   * Returns null when in system mode (no explicit preference).
   *
   * @returns {'light' | 'dark' | null}
   */
  function getStoredTheme() {
    return localStorage.getItem('dn-theme');
  }

  /**
   * Applies a theme by setting or removing the data-theme attribute on <html>
   * and updating localStorage accordingly.
   *
   * @param {'light' | 'dark' | null} theme - null means system default
   */
  function applyTheme(theme) {
    var html = document.documentElement;

    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('dn-theme', 'light');
    } else if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('dn-theme', 'dark');
    } else {
      // System mode: let the CSS prefers-color-scheme media query take over
      html.removeAttribute('data-theme');
      localStorage.removeItem('dn-theme');
    }
  }

  /**
   * Updates which icon inside the toggle button is visible.
   * Only the icon matching the active mode receives the 'active' class.
   * CSS is expected to hide icons that do not have the 'active' class.
   *
   * @param {'light' | 'dark' | null} theme - null means system
   */
  function updateThemeIcon(theme) {
    if (!sunIcon || !moonIcon || !systemIcon) {
      return;
    }

    sunIcon.classList.remove('active');
    moonIcon.classList.remove('active');
    systemIcon.classList.remove('active');

    if (theme === 'light') {
      sunIcon.classList.add('active');
    } else if (theme === 'dark') {
      moonIcon.classList.add('active');
    } else {
      systemIcon.classList.add('active');
    }
  }

  /**
   * Advances to the next state in the cycle: system -> light -> dark -> system.
   *
   * @param {'light' | 'dark' | null} current
   * @returns {'light' | 'dark' | null}
   */
  function nextTheme(current) {
    if (current === null)    { return 'light'; }
    if (current === 'light') { return 'dark'; }
    return null; // dark -> system
  }

  // Initialise icon to match whatever theme the page loaded with.
  // (The <head> inline script already applied the correct data-theme attribute
  // to prevent FOUC; we just need the icon state to be consistent.)
  if (themeToggleBtn) {
    updateThemeIcon(getStoredTheme());

    themeToggleBtn.addEventListener('click', function () {
      var current = getStoredTheme();
      var next    = nextTheme(current);
      applyTheme(next);
      updateThemeIcon(next);
    });
  }

  // When the user is in system mode and changes their OS colour scheme,
  // keep the icon accurate (it still shows the system/monitor icon, but
  // this listener lets us react if we ever want additional system-mode UI).
  var darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function handleSystemColorSchemeChange() {
    // Only act if we are currently in system mode (no explicit preference stored)
    if (getStoredTheme() === null) {
      updateThemeIcon(null);
    }
  }

  if (darkModeMediaQuery.addEventListener) {
    darkModeMediaQuery.addEventListener('change', handleSystemColorSchemeChange);
  } else if (darkModeMediaQuery.addListener) {
    // Safari < 14 fallback
    darkModeMediaQuery.addListener(handleSystemColorSchemeChange);
  }


  // ==================== SMOOTH SCROLLING ====================

  /**
   * Intercepts clicks on anchor links whose href starts with '#' and
   * scrolls to the target element smoothly, accounting for the fixed
   * navigation bar (80px offset).
   */
  var anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash   = this.getAttribute('href');
      // Ignore bare '#' links that have no real target
      if (!hash || hash === '#') {
        return;
      }

      var target = document.querySelector(hash);
      if (!target) {
        return;
      }

      e.preventDefault();

      var NAV_HEIGHT   = 80; // px – height of the fixed nav bar
      var targetTop    = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;

      window.scrollTo({
        top:      targetTop,
        behavior: 'smooth'
      });
    });
  });


  // ==================== NAV SCROLL EFFECT ====================

  /**
   * Adds/removes a 'nav-scrolled' class on the navigation bar depending on
   * how far the page has been scrolled. CSS uses this class to intensify the
   * background opacity and add a shadow.
   */
  var nav              = document.querySelector('.nav');
  var SCROLL_THRESHOLD = 50; // px before the effect kicks in

  function updateNavScrollState() {
    if (!nav) {
      return;
    }

    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }

  window.addEventListener('scroll', updateNavScrollState, { passive: true });

  // Set the correct state on page load in case the user lands partway down.
  updateNavScrollState();


  // ==================== INTERSECTION OBSERVER ANIMATIONS ====================

  /**
   * Observes elements that should animate in when they first enter the viewport.
   * On intersection, the 'visible' class is added and the element is unobserved
   * so the animation only fires once.
   *
   * CSS contract (expected in styles.css):
   *   .feature-card, .integration-card, .step, .use-case,
   *   .screenshot-card, .stat {
   *     opacity: 0;
   *     transform: translateY(30px);
   *     transition: opacity 0.6s ease, transform 0.6s ease;
   *   }
   *   .feature-card.visible, .integration-card.visible, ... {
   *     opacity: 1;
   *     transform: translateY(0);
   *   }
   */

  var ANIMATION_SELECTORS = [
    '.feature-card',
    '.integration-card',
    '.step',
    '.use-case',
    '.screenshot-card',
    '.stat'
  ];

  var animationObserverOptions = {
    threshold:  0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  // Only create the observer when IntersectionObserver is available
  if ('IntersectionObserver' in window) {
    var animationObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animationObserver.unobserve(entry.target);
        }
      });
    }, animationObserverOptions);

    var animationTargets = document.querySelectorAll(ANIMATION_SELECTORS.join(', '));

    animationTargets.forEach(function (el) {
      animationObserver.observe(el);
    });
  }


  // ==================== INTEGRATION BADGE COLOURING ====================

  /**
   * Finds all .integration-badge elements whose text is exactly "Available Now"
   * and adds the 'badge-available' class so CSS can style them green.
   * Running this on DOMContentLoaded ensures all badges are in the DOM.
   */
  function colourIntegrationBadges() {
    var badges = document.querySelectorAll('.integration-badge');

    badges.forEach(function (badge) {
      // Trim surrounding whitespace before comparing to guard against
      // accidental leading/trailing spaces in the HTML source.
      if (badge.textContent.trim() === 'Available Now') {
        badge.classList.add('badge-available');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', colourIntegrationBadges);
  } else {
    // DOMContentLoaded has already fired (script is deferred or at bottom of body)
    colourIntegrationBadges();
  }


  // ==================== SCREENSHOT LIGHTBOX ====================

  /**
   * Opens and closes a full-screen image lightbox when screenshots are clicked.
   *
   * Expected HTML structure (must be present in index.html):
   *
   *   <div id="lightbox" class="lightbox" hidden>
   *     <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
   *     <img class="lightbox-img" src="" alt="">
   *   </div>
   *
   * Screenshots that trigger the lightbox must be inside a .screenshot-frame:
   *
   *   <div class="screenshot-frame">
   *     <img src="..." alt="...">
   *   </div>
   *
   * Accessibility features implemented:
   *   - Focus is moved to the close button when the lightbox opens
   *   - Focus is returned to the triggering image when the lightbox closes
   *   - Tab key is trapped inside the lightbox while it is open
   *   - Escape key closes the lightbox
   *   - Clicking the lightbox backdrop (but not the image) closes it
   */

  var lightbox      = document.querySelector('#lightbox');
  var lightboxImg   = lightbox  ? lightbox.querySelector('.lightbox-img')   : null;
  var lightboxClose = lightbox  ? lightbox.querySelector('.lightbox-close') : null;

  // Track the element that opened the lightbox so focus can be returned on close.
  var lightboxTrigger = null;

  /**
   * Opens the lightbox, loads the supplied image, and moves focus.
   *
   * @param {HTMLImageElement} imgEl - The thumbnail image that was clicked
   */
  function openLightbox(imgEl) {
    if (!lightbox || !lightboxImg || !lightboxClose) {
      return;
    }

    lightboxImg.src = imgEl.src;
    lightboxImg.alt = imgEl.alt || '';

    lightboxTrigger = imgEl;

    lightbox.removeAttribute('hidden');
    document.body.classList.add('lightbox-open');

    // Defer focus to let the browser paint the newly-visible element first
    requestAnimationFrame(function () {
      lightboxClose.focus();
    });
  }

  /**
   * Closes the lightbox and returns focus to the triggering element.
   */
  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.setAttribute('hidden', '');
    document.body.classList.remove('lightbox-open');

    if (lightboxTrigger) {
      lightboxTrigger.focus();
      lightboxTrigger = null;
    }
  }

  /**
   * Traps Tab/Shift+Tab focus inside the lightbox while it is open.
   * The only focusable element inside the lightbox is the close button,
   * so Tab and Shift+Tab both cycle back to it.
   *
   * @param {KeyboardEvent} e
   */
  function trapFocus(e) {
    if (!lightbox || lightbox.hasAttribute('hidden')) {
      return;
    }

    if (e.key !== 'Tab') {
      return;
    }

    // There is only one focusable element (lightboxClose), so keep focus there.
    if (document.activeElement !== lightboxClose) {
      e.preventDefault();
      lightboxClose.focus();
    }
  }

  // Wire up lightbox only when the required elements exist in the DOM
  if (lightbox && lightboxImg && lightboxClose) {

    // Open lightbox on thumbnail click
    var screenshotFrames = document.querySelectorAll('.screenshot-frame img');

    screenshotFrames.forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.setAttribute('tabindex', '0');

      img.addEventListener('click', function () {
        openLightbox(this);
      });

      // Also support keyboard activation (Enter / Space) for accessibility
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(this);
        }
      });
    });

    // Close via the close button
    lightboxClose.addEventListener('click', closeLightbox);

    // Close when clicking the backdrop (the lightbox container itself),
    // but NOT when clicking the image inside it
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Close on Escape; trap focus while open
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
        closeLightbox();
        return;
      }

      trapFocus(e);
    });
  }


  // ==================== SCREENSHOT GALLERY SCROLL INDICATORS ====================

  /**
   * Optional enhancement for mobile: observes horizontal scroll position of
   * .screenshot-gallery containers and toggles 'has-scroll-left' /
   * 'has-scroll-right' classes so CSS can render fade-out edge indicators.
   *
   * This is purely cosmetic and degrades gracefully when the element is absent
   * or when the browser does not support the required APIs.
   */

  var screenshotGalleries = document.querySelectorAll('.screenshot-gallery');

  screenshotGalleries.forEach(function (gallery) {
    /**
     * Reads the current scroll position of the gallery and updates CSS classes.
     */
    function updateScrollIndicators() {
      var scrollLeft  = gallery.scrollLeft;
      var maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;

      gallery.classList.toggle('has-scroll-left',  scrollLeft > 0);
      gallery.classList.toggle('has-scroll-right', scrollLeft < maxScrollLeft - 1);
    }

    gallery.addEventListener('scroll', updateScrollIndicators, { passive: true });

    // Also update on window resize in case the gallery width changes
    window.addEventListener('resize', updateScrollIndicators, { passive: true });

    // Set initial state
    updateScrollIndicators();
  });

}());
