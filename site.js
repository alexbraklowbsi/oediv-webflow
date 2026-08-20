function onReady(fn){
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

(function () {
  /*
   * Mega Menu
   */
  onReady(function () {
    'use strict';

    const PANEL_DURATION = 280;
    const PRIMARY_FADE_DURATION = 200;
    const EASING = 'cubic-bezier(0.42, 0, 0.58, 1)';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const megaNav = document.querySelector('[data-mega-nav="true"]');

    if (!megaNav) return;

    const topLevelTriggers = Array.from(megaNav.querySelectorAll('.nav_menu-trigger[data-mega-trigger]'));

    const solutionsTrigger = megaNav.querySelector('[data-mega-trigger="loesungen"]');

    const solutionsPanel = document.getElementById('mega-loesungen');

    const solutionsPrimaryColumn = solutionsPanel ? solutionsPanel.querySelector('.mega_menu-column.is-primary') : null;

    const sectionButtons = solutionsPanel ? Array.from(solutionsPanel.querySelectorAll('button[data-mega-section]')) : [];

    const searchTrigger = document.getElementById('nav-search-trigger');

    const searchPanel = document.getElementById('site-search-panel');

    const searchInput = document.getElementById('site-search-input');

    const searchClose = document.getElementById('site-search-close');

    let solutionsAnimationId = 0;

    function waitForLayout() {
      return new Promise(function (resolve) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(resolve);
        });
      });
    }

    function getTopLevelPanel(trigger) {
      const panelId = trigger.getAttribute('aria-controls');

      if (!panelId) return null;

      return document.getElementById(panelId);
    }

    function getControlledPanels(button) {
      const controlledIds = (button.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean);

      return controlledIds
        .map(function (id) {
          return document.getElementById(id);
        })
        .filter(Boolean);
    }

    function getFirstFocusableElement(container) {
      if (!container) return null;

      return container.querySelector(['a[href]:not([tabindex="-1"])', 'button:not([disabled]):not([tabindex="-1"])', 'input:not([disabled]):not([tabindex="-1"])', '[tabindex]:not([tabindex="-1"])'].join(','));
    }

    function cancelSolutionsAnimations() {
      if (solutionsPanel) {
        solutionsPanel.getAnimations().forEach(function (animation) {
          animation.cancel();
        });
      }

      if (solutionsPrimaryColumn) {
        solutionsPrimaryColumn.getAnimations().forEach(function (animation) {
          animation.cancel();
        });
      }
    }

    function resetSolutionsStyles() {
      if (solutionsPanel) {
        solutionsPanel.style.height = '';
        solutionsPanel.style.overflow = '';
      }

      if (solutionsPrimaryColumn) {
        solutionsPrimaryColumn.style.opacity = '';
        solutionsPrimaryColumn.style.transform = '';
        solutionsPrimaryColumn.style.pointerEvents = '';
      }
    }

    function setTopLevelTriggerState(trigger, isOpen) {
      trigger.setAttribute('aria-expanded', String(isOpen));

      trigger.classList.toggle('is-active', isOpen);

      const icon = trigger.querySelector('.nav_menu-trigger-icon-image');

      if (icon) {
        icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    }

    function closeAllSections() {
      sectionButtons.forEach(function (button) {
        button.setAttribute('aria-expanded', 'false');
        button.classList.remove('is-active');

        getControlledPanels(button).forEach(function (panel) {
          panel.hidden = true;
        });
      });
    }

    function openSection(button) {
      closeAllSections();

      button.setAttribute('aria-expanded', 'true');
      button.classList.add('is-active');

      getControlledPanels(button).forEach(function (panel) {
        panel.hidden = false;
      });
    }

    async function animateSolutionsOpen(moveFocusInside) {
      if (!solutionsPanel) return;

      const animationId = ++solutionsAnimationId;
      const wasHidden = solutionsPanel.hidden;

      const currentHeight = wasHidden ? 0 : solutionsPanel.getBoundingClientRect().height;

      cancelSolutionsAnimations();

      if (solutionsPrimaryColumn) {
        solutionsPrimaryColumn.style.opacity = '0';
        solutionsPrimaryColumn.style.transform = 'translateY(-0.35rem)';
        solutionsPrimaryColumn.style.pointerEvents = 'none';
      }

      solutionsPanel.style.height = currentHeight + 'px';
      solutionsPanel.style.overflow = 'hidden';
      solutionsPanel.hidden = false;

      if (reduceMotion) {
        resetSolutionsStyles();

        if (moveFocusInside && sectionButtons.length) {
          sectionButtons[0].focus();
        }

        return;
      }

      await waitForLayout();

      if (animationId !== solutionsAnimationId) return;

      const targetHeight = solutionsPanel.scrollHeight;

      const panelAnimation = solutionsPanel.animate([{ height: currentHeight + 'px' }, { height: targetHeight + 'px' }], {
        duration: PANEL_DURATION,
        easing: EASING,
        fill: 'forwards',
      });

      try {
        await panelAnimation.finished;
      } catch (error) {
        return;
      }

      if (animationId !== solutionsAnimationId) return;

      solutionsPanel.style.height = targetHeight + 'px';
      panelAnimation.cancel();

      solutionsPanel.style.height = '';
      solutionsPanel.style.overflow = '';

      if (solutionsPrimaryColumn) {
        const primaryAnimation = solutionsPrimaryColumn.animate(
          [
            {
              opacity: 0,
              transform: 'translateY(-0.35rem)',
            },
            {
              opacity: 1,
              transform: 'translateY(0)',
            },
          ],
          {
            duration: PRIMARY_FADE_DURATION,
            easing: EASING,
            fill: 'forwards',
          },
        );

        try {
          await primaryAnimation.finished;
        } catch (error) {
          return;
        }

        if (animationId !== solutionsAnimationId) return;

        solutionsPrimaryColumn.style.opacity = '1';
        solutionsPrimaryColumn.style.transform = 'translateY(0)';

        primaryAnimation.cancel();
      }

      resetSolutionsStyles();

      if (moveFocusInside && sectionButtons.length) {
        sectionButtons[0].focus();
      }
    }

    async function animateSolutionsClose(returnFocus) {
      if (!solutionsPanel) return;

      const animationId = ++solutionsAnimationId;

      if (solutionsPanel.hidden) {
        resetSolutionsStyles();

        if (returnFocus && solutionsTrigger) {
          solutionsTrigger.focus();
        }

        return;
      }

      const currentHeight = solutionsPanel.getBoundingClientRect().height;

      cancelSolutionsAnimations();

      solutionsPanel.style.height = currentHeight + 'px';
      solutionsPanel.style.overflow = 'hidden';

      closeAllSections();

      if (reduceMotion) {
        solutionsPanel.hidden = true;
        resetSolutionsStyles();

        if (returnFocus && solutionsTrigger) {
          solutionsTrigger.focus();
        }

        return;
      }

      const panelAnimation = solutionsPanel.animate([{ height: currentHeight + 'px' }, { height: '0px' }], {
        duration: PANEL_DURATION,
        easing: EASING,
        fill: 'forwards',
      });

      try {
        await panelAnimation.finished;
      } catch (error) {
        return;
      }

      if (animationId !== solutionsAnimationId) return;

      solutionsPanel.style.height = '0px';
      panelAnimation.cancel();

      solutionsPanel.hidden = true;
      resetSolutionsStyles();

      if (returnFocus && solutionsTrigger) {
        solutionsTrigger.focus();
      }
    }

    function closeSolutionsImmediately() {
      if (!solutionsTrigger || !solutionsPanel) return;

      ++solutionsAnimationId;

      cancelSolutionsAnimations();
      setTopLevelTriggerState(solutionsTrigger, false);
      closeAllSections();

      solutionsPanel.hidden = true;
      resetSolutionsStyles();
    }

    function closeTopLevelMenu(trigger, returnFocus, animateMenu) {
      const panel = getTopLevelPanel(trigger);

      setTopLevelTriggerState(trigger, false);

      if (trigger === solutionsTrigger) {
        if (animateMenu) {
          animateSolutionsClose(returnFocus);
        } else {
          closeSolutionsImmediately();
        }

        return;
      }

      if (panel) {
        panel.hidden = true;
      }

      if (returnFocus) {
        trigger.focus();
      }
    }

    function closeAllTopLevelMenus(exceptTrigger) {
      topLevelTriggers.forEach(function (trigger) {
        if (trigger === exceptTrigger) return;

        closeTopLevelMenu(trigger, false, false);
      });
    }

    function closeSearch(returnFocus) {
      if (!searchTrigger || !searchPanel) return;

      searchTrigger.setAttribute('aria-expanded', 'false');

      searchTrigger.classList.remove('is-active');
      searchPanel.hidden = true;

      if (returnFocus) {
        searchTrigger.focus();
      }
    }

    function openSearch() {
      if (!searchTrigger || !searchPanel) return;

      closeAllTopLevelMenus();

      searchTrigger.setAttribute('aria-expanded', 'true');

      searchTrigger.classList.add('is-active');
      searchPanel.hidden = false;

      window.requestAnimationFrame(function () {
        if (searchInput) {
          searchInput.focus();
        }
      });
    }

    function openTopLevelMenu(trigger, moveFocusInside) {
      const panel = getTopLevelPanel(trigger);

      if (!panel) return;

      closeSearch(false);
      closeAllTopLevelMenus(trigger);

      setTopLevelTriggerState(trigger, true);

      if (trigger === solutionsTrigger) {
        animateSolutionsOpen(moveFocusInside);
        return;
      }

      panel.hidden = false;

      if (!moveFocusInside) return;

      window.requestAnimationFrame(function () {
        const firstFocusable = getFirstFocusableElement(panel);

        if (firstFocusable) {
          firstFocusable.focus();
        }
      });
    }

    topLevelTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          closeTopLevelMenu(trigger, false, true);

          return;
        }

        const openedWithKeyboard = event.detail === 0;

        openTopLevelMenu(trigger, openedWithKeyboard);
      });
    });

    sectionButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          closeAllSections();
        } else {
          openSection(button);
        }
      });

      button.addEventListener('keydown', function (event) {
        const isOpen = button.getAttribute('aria-expanded') === 'true';

        if (event.key !== 'Tab' || event.shiftKey || !isOpen) {
          return;
        }

        const firstFocusable = getControlledPanels(button).map(getFirstFocusableElement).find(Boolean);

        if (!firstFocusable) return;

        event.preventDefault();
        firstFocusable.focus();
      });
    });

    if (searchTrigger && searchPanel) {
      searchTrigger.addEventListener('click', function () {
        const isOpen = searchTrigger.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          closeSearch(false);
        } else {
          openSearch();
        }
      });
    }

    if (searchClose) {
      searchClose.addEventListener('click', function () {
        closeSearch(true);
      });
    }

    document.addEventListener(
      'keydown',
      function (event) {
        const isEscape = event.key === 'Escape' || event.key === 'Esc';

        if (!isEscape) return;

        if (searchPanel && !searchPanel.hidden) {
          event.preventDefault();
          event.stopPropagation();

          closeSearch(true);
          return;
        }

        const openTrigger = topLevelTriggers.find(function (trigger) {
          return trigger.getAttribute('aria-expanded') === 'true';
        });

        if (!openTrigger) return;

        event.preventDefault();
        event.stopPropagation();

        closeTopLevelMenu(openTrigger, true, true);
      },
      true,
    );
  });
})();

(function () {
  /*
   * Language switcher
   */
  onReady(function () {
    'use strict';

    const switcher = document.querySelector('.nav_language-switcher');

    if (!switcher) return;

    const languageLinks = Array.from(switcher.querySelectorAll('.nav_language-link'));

    if (languageLinks.length < 2) return;

    const documentLanguage = (document.documentElement.lang || 'de').toLowerCase();

    const currentLanguage = documentLanguage.startsWith('en') ? 'en' : 'de';

    const alternateLanguage = currentLanguage === 'de' ? 'en' : 'de';

    const currentLink = languageLinks.find(function (link) {
      return link.getAttribute('lang') === currentLanguage;
    });

    const alternateLink = languageLinks.find(function (link) {
      return link.getAttribute('lang') === alternateLanguage;
    });

    if (!currentLink || !alternateLink) return;

    const currentHreflang = document.head.querySelector('link[rel="alternate"][hreflang="' + currentLanguage + '"]');

    const alternateHreflang = document.head.querySelector('link[rel="alternate"][hreflang="' + alternateLanguage + '"]');

    if (currentHreflang) {
      currentLink.href = currentHreflang.href;
    }

    if (alternateHreflang) {
      alternateLink.href = alternateHreflang.href;
    }

    currentLink.classList.add('is-active', 'is-current');

    currentLink.classList.remove('is-alternate');

    currentLink.setAttribute('role', 'button');
    currentLink.setAttribute('aria-current', 'page');
    currentLink.setAttribute('aria-haspopup', 'true');
    currentLink.setAttribute('aria-expanded', 'false');
    currentLink.setAttribute('aria-controls', 'language-alternate-link');

    alternateLink.classList.remove('is-active', 'is-current');

    alternateLink.classList.add('is-alternate');
    alternateLink.removeAttribute('aria-current');
    alternateLink.id = 'language-alternate-link';

    /*
     * Aktuelle Sprache steht nach dem Globus,
     * alternative Sprache folgt als Pulldown.
     */
    switcher.append(currentLink, alternateLink);

    function openSwitcher(moveFocus) {
      currentLink.setAttribute('aria-expanded', 'true');

      alternateLink.hidden = false;
      switcher.classList.add('is-open');

      if (moveFocus) {
        window.requestAnimationFrame(function () {
          alternateLink.focus();
        });
      }
    }

    function closeSwitcher(returnFocus) {
      currentLink.setAttribute('aria-expanded', 'false');

      switcher.classList.remove('is-open');
      alternateLink.hidden = true;

      if (returnFocus) {
        currentLink.focus();
      }
    }

    currentLink.addEventListener('click', function (event) {
      event.preventDefault();

      const isOpen = currentLink.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        closeSwitcher(false);
      } else {
        openSwitcher(event.detail === 0);
      }
    });

    currentLink.addEventListener('keydown', function (event) {
      if (event.key !== ' ' && event.key !== 'ArrowDown') {
        return;
      }

      event.preventDefault();
      openSwitcher(true);
    });

    document.addEventListener('click', function (event) {
      if (switcher.contains(event.target)) return;

      closeSwitcher(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.key !== 'Esc') {
        return;
      }

      if (currentLink.getAttribute('aria-expanded') !== 'true') {
        return;
      }

      event.preventDefault();
      closeSwitcher(true);
    });

    switcher.addEventListener('focusout', function () {
      window.requestAnimationFrame(function () {
        if (!switcher.contains(document.activeElement)) {
          closeSwitcher(false);
        }
      });
    });

    /*
     * Verhindert, dass EN beim Laden kurz sichtbar bleibt.
     */
    closeSwitcher(false);
  });
})();

(function () {
  /*
   * Client und Iso Tool-Tip
   */
  window.Webflow = window.Webflow || [];

  window.Webflow.push(function () {
    'use strict';

    const STYLE_ID = 'client-logo-tooltip-styles';
    const WRAPPER_SELECTOR = '.uui-logos01_wrapper';
    const IMAGE_SELECTOR = '.uui-logos01_logo';
    const TOOLTIP_SELECTOR = '.clinet-logo-iso-text';

    /*
     * Tooltip-Styles einmalig einfügen.
     */
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;

      style.textContent = `
        ${WRAPPER_SELECTOR} {
          position: relative;
        }

        ${WRAPPER_SELECTOR} ${TOOLTIP_SELECTOR} {
          position: absolute;
          top: -10px;
          left: 50%;
          bottom: calc(100% + 10px);
          z-index: 10;
          white-space: nowrap;
          
          background-color: #ffffff;
          
          pointer-events: none;

          opacity: 0;
          visibility: hidden;
          transform: translateX(-50%) scale(0.88);
          transform-origin: center bottom;

          transition:
            opacity 180ms ease-in-out,
            transform 180ms ease-in-out,
            visibility 180ms ease-in-out;
        }

        ${WRAPPER_SELECTOR}.is-tooltip-visible ${TOOLTIP_SELECTOR} {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) scale(1);
        }

        @media (prefers-reduced-motion: reduce) {
          ${WRAPPER_SELECTOR} ${TOOLTIP_SELECTOR} {
            transition: none;
          }
        }
      `;

      document.head.appendChild(style);
    }

    /*
     * Alle Logo-Tooltips initialisieren.
     */
    document.querySelectorAll(WRAPPER_SELECTOR).forEach(function (wrapper, index) {
      const image = wrapper.querySelector(IMAGE_SELECTOR);
      const tooltip = wrapper.querySelector(TOOLTIP_SELECTOR);

      if (!image || !tooltip) return;

      const tooltipId = `client-logo-tooltip-${index + 1}`;

      tooltip.id = tooltipId;
      tooltip.setAttribute('role', 'tooltip');

      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-describedby', tooltipId);

      function showTooltip() {
        wrapper.classList.add('is-tooltip-visible');
      }

      function hideTooltip() {
        wrapper.classList.remove('is-tooltip-visible');
      }

      image.addEventListener('mouseenter', showTooltip);
      image.addEventListener('mouseleave', hideTooltip);

      wrapper.addEventListener('focus', showTooltip);
      wrapper.addEventListener('blur', hideTooltip);

      wrapper.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          hideTooltip();
          wrapper.blur();
        }
      });
    });
  });
})();

(function () {
  /*
   * Case Data Counter
   */
  onReady(function () {
    document.querySelectorAll('[counter-data]').forEach((el) => {
      const target = parseFloat(el.getAttribute('counter-data').replace(',', '.'));
      const duration = 1600;

      new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting) return;

        const start = performance.now();

        function count(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          el.textContent = (target * eased).toFixed(2).replace('.', ',');

          if (progress < 1) requestAnimationFrame(count);
        }

        requestAnimationFrame(count);
        observer.disconnect();
      }).observe(el);
    });
  });
})();

(function () {
  window.Webflow = window.Webflow || [];

  window.Webflow.push(function () {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function getReferenceContainer() {
      return Array.from(
        document.querySelectorAll(".udesly-container:not(.is-slider)")
      )
        .filter(function (container) {
          const rect = container.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .sort(function (a, b) {
          return (
            b.getBoundingClientRect().width - a.getBoundingClientRect().width
          );
        })[0];
    }

    document.querySelectorAll(".std-slider").forEach(function (slider) {
      const layout = slider.dataset.sliderLayout || "contained";

      const sliderContainer = slider.closest(".udesly-container.is-slider");
      const viewport = slider.querySelector(".std-slider-viewport");
      const track = slider.querySelector(".std-slider-track");
      const slides = Array.from(slider.querySelectorAll(".std-slider-slide"));
      const prev = slider.querySelector("[data-slider-prev]");
      const next = slider.querySelector("[data-slider-next]");

      if (!viewport || !track || !slides.length || !prev || !next) {
        return;
      }

      const move = Math.max(1, parseInt(slider.dataset.sliderMove, 10) || 1);

      const autoSlideValue =
        slider.getAttribute("auto-slide") || slider.dataset.sliderAuto;

      const autoSlideEnabled = autoSlideValue === "true";

      const autoSlideInterval = Math.max(
        1000,
        parseInt(
          slider.getAttribute("auto-slide-interval") ||
            slider.dataset.sliderInterval,
          10
        ) || 5000
      );

      /* ----------------------------------------------------------------
       * Feintuning für das Drag-Gefühl
       * ---------------------------------------------------------------- */
      const RELEASE_PROJECTION = 120;   // ms Nachlauf der Geschwindigkeit (größer = mehr "Throw")
      const COMMIT_THRESHOLD = 0.15;    // Anteil einer Slide bis zum Wechsel (kleiner = früher)
      const IDLE_VELOCITY_RESET = 80;   // ms – stand der Finger länger, gilt es nicht als Flick
      const RELEASE_MIN_DURATION = 280; // ms
      const RELEASE_MAX_DURATION = 600; // ms
      const AXIS_LOCK = 6;              // px bis die Wischrichtung feststeht
      const EDGE_RESISTANCE = 0.3;      // Rubber-Band jenseits der Ränder (0 = hart, 1 = kein Widerstand)

      /* Bewegungszustand (alles in px, "offset" = wie weit nach links geschoben) */
      let offset = 0;
      let step = 0;

      let animationFrame = null;
      let dragFrame = null;
      let pendingOffset = null;
      let resizeFrame;
      let autoSlideTimer;
      let wheelIdleTimer;

      let isHovered = false;
      let isFocused = false;
      let isDragging = false;
      let dragMoved = false;
      let dragAxis = null;

      let dragStartX = 0;
      let dragStartY = 0;
      let dragStartOffset = 0;

      let velocity = 0;      // px/ms im Offset-Raum
      let lastOffset = 0;
      let lastMoveTime = 0;

      let suppressClick = false;
      let lastTouchTime = 0;

      /* ----------------------------------------------------------------
       * Nativen Scroll abschalten – die gesamte Bewegung läuft jetzt
       * GPU-kompositiert über transform. Das ist die eigentliche
       * Ursache für flüssiges vs. hakeliges Verhalten.
       * ---------------------------------------------------------------- */
      viewport.style.overflow = "hidden";
      viewport.style.scrollSnapType = "none";
      viewport.style.scrollBehavior = "auto";
      viewport.style.cursor = "grab";
      viewport.style.touchAction = "pan-y"; // vertikales Scrollen bleibt dem Browser

      track.style.willChange = "transform";
      track.style.transform = "translate3d(0, 0, 0)";
      track.style.backfaceVisibility = "hidden";

      slides.forEach(function (slide) {
        slide.querySelectorAll("img").forEach(function (image) {
          image.setAttribute("draggable", "false");
          image.style.webkitUserDrag = "none";
        });
      });

      function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
      }

      function getVisibleSlides() {
        const width = window.innerWidth;
        let value;

        if (width >= 1600) {
          value =
            slider.dataset.sliderLargeDesktop || slider.dataset.sliderDesktop;
        } else if (width >= 1280) {
          value =
            slider.dataset.sliderDesktop || slider.dataset.sliderLargeDesktop;
        } else if (width >= 992) {
          value =
            slider.dataset.sliderLaptop ||
            slider.dataset.sliderTablet ||
            slider.dataset.sliderDesktop;
        } else if (width >= 768) {
          value = slider.dataset.sliderTablet || slider.dataset.sliderLaptop;
        } else if (width >= 480) {
          value = slider.dataset.sliderLandscape;
        } else {
          value = slider.dataset.sliderPortrait;
        }

        return Math.max(1, parseFloat(value) || 1);
      }

      /*
       * Transform ist layout-neutral, daher bleibt scrollWidth stabil,
       * egal wie weit der Track geschoben ist.
       */
      function getMaxOffset() {
        return Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      }

      function applyTransform() {
        track.style.transform = "translate3d(" + -offset + "px, 0, 0)";
      }

      function setOffset(value) {
        offset = value;
        applyTransform();
      }

      function updateButtons() {
        const maxOffset = getMaxOffset();

        prev.disabled = offset <= 2;
        next.disabled = maxOffset <= 2 || offset >= maxOffset - 2;
      }

      function cancelAnimation() {
        if (!animationFrame) return;
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      /*
       * Zentrale Bewegungs-Animation.
       *
       * ease === "out": startet mit der Wischgeschwindigkeit und läuft
       *   sanft aus (easeOutCubic). Fürs Loslassen => kein Bruch, gleitet.
       *
       * ease === "inOut": weiches Ein-/Aus aus dem Stand.
       *   Für Buttons, Tastatur und Auto-Slide.
       */
      function animateTo(targetOffset, options) {
        cancelAnimation();

        const settings = options || {};
        const ease = settings.ease || "inOut";
        const releaseVelocity = settings.velocity || 0;

        const start = offset;
        const target = clamp(targetOffset, 0, getMaxOffset());
        const distance = target - start;

        if (reducedMotion.matches || Math.abs(distance) < 0.5) {
          setOffset(target);
          updateButtons();
          return;
        }

        let duration;

        if (ease === "out") {
          /*
           * easeOutCubic hat am Start die Steigung 3:
           * v0 = 3 * distance / duration  =>  duration = 3 * distance / v0.
           * Dadurch setzt die Animation die Fingergeschwindigkeit nahtlos fort.
           */
          const speed = Math.abs(releaseVelocity);
          duration =
            speed > 0.01
              ? clamp(
                  (Math.abs(distance) * 3) / speed,
                  RELEASE_MIN_DURATION,
                  RELEASE_MAX_DURATION
                )
              : 460;
        } else {
          duration = 460;
        }

        let startTime = null;

        function frame(time) {
          if (startTime === null) startTime = time;

          const progress = Math.min(1, (time - startTime) / duration);

          let eased;

          if (ease === "out") {
            eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          } else {
            eased =
              progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOutQuad
          }

          setOffset(start + distance * eased);

          if (progress < 1) {
            animationFrame = requestAnimationFrame(frame);
          } else {
            animationFrame = null;
            setOffset(target);
            updateButtons();
          }
        }

        animationFrame = requestAnimationFrame(frame);
      }

      function moveSlider(direction) {
        if (!step) return;

        const currentIndex = Math.round(offset / step);

        animateTo((currentIndex + direction * move) * step, { ease: "inOut" });
      }

      function layoutSlider() {
        cancelAnimation();

        const pageWidth = document.documentElement.clientWidth;

        const oldIndex = step ? Math.round(offset / step) : 0;

        let viewportWidth;

        if (layout === "edge") {
          const referenceContainer = getReferenceContainer();

          let rightBuffer = pageWidth * 0.05;

          if (referenceContainer && sliderContainer) {
            const referenceRect = referenceContainer.getBoundingClientRect();

            rightBuffer = Math.max(0, pageWidth - referenceRect.right);

            sliderContainer.style.setProperty(
              "--std-slider-container-left",
              referenceRect.left + "px"
            );

            sliderContainer.style.setProperty(
              "--std-slider-container-width",
              referenceRect.width + "px"
            );
          }

          const viewportLeft = viewport.getBoundingClientRect().left;

          viewportWidth = Math.max(0, pageWidth - viewportLeft);

          slider.style.setProperty(
            "--std-slider-viewport-width",
            viewportWidth + "px"
          );

          slider.style.setProperty(
            "--std-slider-end-buffer",
            rightBuffer + "px"
          );
        } else {
          slider.style.setProperty("--std-slider-viewport-width", "100%");
          slider.style.setProperty("--std-slider-end-buffer", "0px");

          viewportWidth = viewport.clientWidth;
        }

        const visibleSlides = getVisibleSlides();

        const trackStyles = window.getComputedStyle(track);

        const gap =
          parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

        const slideWidth = Math.max(
          1,
          (viewportWidth - gap * (visibleSlides - 1)) / visibleSlides
        );

        const slideSize = slideWidth + "px";

        slider.style.setProperty("--std-slider-slide-width", slideSize);

        slides.forEach(function (slide) {
          slide.style.setProperty("flex", "0 0 " + slideSize);
          slide.style.setProperty("width", slideSize);
          slide.style.setProperty("max-width", slideSize);
        });

        step = slideWidth + gap;

        setOffset(clamp(oldIndex * step, 0, getMaxOffset()));

        updateButtons();
        restartAutoSlide();
      }

      /* ---------------- Auto-Slide ---------------- */

      function clearAutoSlide() {
        window.clearTimeout(autoSlideTimer);
        autoSlideTimer = null;
      }

      function autoSlideIsPaused() {
        return (
          reducedMotion.matches ||
          isHovered ||
          isFocused ||
          isDragging ||
          document.hidden ||
          getMaxOffset() <= 2
        );
      }

      function scheduleAutoSlide() {
        clearAutoSlide();

        if (!autoSlideEnabled || autoSlideIsPaused()) {
          return;
        }

        autoSlideTimer = window.setTimeout(runAutoSlide, autoSlideInterval);
      }

      function restartAutoSlide() {
        clearAutoSlide();
        scheduleAutoSlide();
      }

      function runAutoSlide() {
        if (autoSlideIsPaused()) return;

        if (offset >= getMaxOffset() - 2) {
          animateTo(0, { ease: "inOut" });
        } else {
          moveSlider(1);
        }

        scheduleAutoSlide();
      }

      /* ---------------- Drag-Mechanik (transform-basiert) ---------------- */

      function requestDragRender(value) {
        pendingOffset = value;

        if (!dragFrame) {
          dragFrame = requestAnimationFrame(function () {
            dragFrame = null;

            if (pendingOffset === null) return;

            setOffset(pendingOffset);
            pendingOffset = null;
          });
        }
      }

      function cancelDragRender() {
        if (dragFrame) {
          cancelAnimationFrame(dragFrame);
          dragFrame = null;
        }

        if (pendingOffset !== null) {
          setOffset(pendingOffset);
          pendingOffset = null;
        }
      }

      function startDragging(x, y) {
        cancelAnimation();
        cancelDragRender();
        clearAutoSlide();

        isDragging = true;
        dragMoved = false;
        dragAxis = null;

        dragStartX = x;
        dragStartY = y;
        dragStartOffset = offset;

        velocity = 0;
        lastOffset = offset;
        lastMoveTime = performance.now();

        viewport.style.cursor = "grabbing";
        document.documentElement.style.userSelect = "none";

        slider.classList.add("is-dragging");
      }

      function moveDragging(x, y, event) {
        if (!isDragging) return;

        const differenceX = x - dragStartX;
        const differenceY = y - dragStartY;

        if (!dragAxis) {
          if (Math.max(Math.abs(differenceX), Math.abs(differenceY)) < AXIS_LOCK) {
            return;
          }

          if (Math.abs(differenceX) > Math.abs(differenceY)) {
            dragAxis = "horizontal";

            // Ohne Sprung starten: aktueller Punkt wird zum Nullpunkt
            dragStartX = x;
            dragStartOffset = offset;
            lastOffset = offset;
            lastMoveTime = performance.now();
          } else {
            // Vertikal: Drag verwerfen, Seite scrollt normal weiter.
            dragAxis = "vertical";
            isDragging = false;

            slider.classList.remove("is-dragging");
            viewport.style.cursor = "grab";
            document.documentElement.style.removeProperty("user-select");

            return;
          }
        }

        if (dragAxis !== "horizontal") return;

        dragMoved = true;

        if (event.cancelable) {
          event.preventDefault();
        }

        const maxOffset = getMaxOffset();

        let raw = dragStartOffset - (x - dragStartX);

        // Sanfter Widerstand jenseits der Ränder (Rubber-Band).
        if (raw < 0) {
          raw = raw * EDGE_RESISTANCE;
        } else if (raw > maxOffset) {
          raw = maxOffset + (raw - maxOffset) * EDGE_RESISTANCE;
        }

        // Geschwindigkeit glätten (Low-Pass) für stabile Flick-Erkennung.
        const now = performance.now();
        const elapsed = now - lastMoveTime;

        if (elapsed > 0) {
          const instantaneous = (raw - lastOffset) / elapsed;
          velocity = velocity * 0.6 + instantaneous * 0.4;
          lastOffset = raw;
          lastMoveTime = now;
        }

        requestDragRender(raw);
      }

      function settleDrag() {
        if (!step) {
          updateButtons();
          return;
        }

        const maxOffset = getMaxOffset();

        // Finger vor dem Loslassen kurz still? Dann kein Flick.
        if (performance.now() - lastMoveTime > IDLE_VELOCITY_RESET) {
          velocity = 0;
        }

        const clampedOffset = clamp(offset, 0, maxOffset);
        const startIndex = Math.round(dragStartOffset / step);

        // Momentum-Projektion aus der Restgeschwindigkeit.
        const projected = clampedOffset + velocity * RELEASE_PROJECTION;

        let targetIndex = Math.round(projected / step);

        // Kleine Schwelle: schon ein leichtes Ziehen wechselt die Slide.
        const moved = clampedOffset / step - startIndex;

        if (targetIndex === startIndex && Math.abs(moved) > COMMIT_THRESHOLD) {
          targetIndex = startIndex + (moved > 0 ? 1 : -1);
        }

        targetIndex = Math.max(0, targetIndex);

        animateTo(targetIndex * step, { ease: "out", velocity: velocity });
      }

      function finishDragging(shouldSettle) {
        if (!isDragging) return;

        cancelDragRender();

        const wasHorizontalDrag = dragMoved && dragAxis === "horizontal";

        isDragging = false;

        slider.classList.remove("is-dragging");
        viewport.style.cursor = "grab";
        document.documentElement.style.removeProperty("user-select");

        if (wasHorizontalDrag) {
          suppressClick = true;

          window.setTimeout(function () {
            suppressClick = false;
          }, 120);

          if (shouldSettle) {
            settleDrag();
          } else {
            animateTo(clamp(offset, 0, getMaxOffset()), {
              ease: "out",
              velocity: velocity
            });
          }
        } else {
          updateButtons();
        }

        dragAxis = null;
        restartAutoSlide();
      }

      /* ---------------- Events ---------------- */

      prev.addEventListener("click", function () {
        moveSlider(-1);
        restartAutoSlide();
      });

      next.addEventListener("click", function () {
        moveSlider(1);
        restartAutoSlide();
      });

      // Desktop: Maus-Drag über Window-Events (auch außerhalb des Sliders).
      viewport.addEventListener("mousedown", function (event) {
        if (Date.now() - lastTouchTime < 700) {
          return;
        }

        if (event.button !== 0) return;

        if (
          event.target.closest(
            'button, input, select, textarea, [contenteditable="true"]'
          )
        ) {
          return;
        }

        event.preventDefault();
        startDragging(event.clientX, event.clientY);
      });

      window.addEventListener("mousemove", function (event) {
        moveDragging(event.clientX, event.clientY, event);
      });

      window.addEventListener("mouseup", function () {
        finishDragging(true);
      });

      window.addEventListener("blur", function () {
        finishDragging(false);
      });

      // Mobile: eigene Touch-Mechanik.
      viewport.addEventListener(
        "touchstart",
        function (event) {
          if (event.touches.length !== 1) return;

          if (
            event.target.closest(
              'button, input, select, textarea, [contenteditable="true"]'
            )
          ) {
            return;
          }

          lastTouchTime = Date.now();

          const touch = event.touches[0];
          startDragging(touch.clientX, touch.clientY);
        },
        { passive: true }
      );

      viewport.addEventListener(
        "touchmove",
        function (event) {
          if (!isDragging || event.touches.length !== 1) return;

          const touch = event.touches[0];
          moveDragging(touch.clientX, touch.clientY, event);
        },
        { passive: false }
      );

      viewport.addEventListener("touchend", function () {
        finishDragging(true);
      });

      viewport.addEventListener("touchcancel", function () {
        finishDragging(false);
      });

      viewport.addEventListener(
        "click",
        function (event) {
          if (!suppressClick) return;

          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true
      );

      viewport.addEventListener("dragstart", function (event) {
        event.preventDefault();
      });

      // Trackpad: nur bei horizontaler Absicht übernehmen, sonst Seite scrollen.
      viewport.addEventListener(
        "wheel",
        function (event) {
          if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
            return;
          }

          event.preventDefault();

          cancelAnimation();
          clearAutoSlide();

          setOffset(clamp(offset + event.deltaX, 0, getMaxOffset()));
          updateButtons();

          window.clearTimeout(wheelIdleTimer);

          wheelIdleTimer = window.setTimeout(function () {
            if (step) {
              animateTo(Math.round(offset / step) * step, {
                ease: "out",
                velocity: 0
              });
            }
            restartAutoSlide();
          }, 90);
        },
        { passive: false }
      );

      viewport.addEventListener("mouseenter", function () {
        isHovered = true;
        clearAutoSlide();
      });

      viewport.addEventListener("mouseleave", function () {
        isHovered = false;
        scheduleAutoSlide();
      });

      slider.addEventListener("focusin", function (event) {
        isFocused = true;
        clearAutoSlide();

        // Fokussierte Slide bei Tastaturnavigation ins Sichtfeld holen.
        if (step && !isDragging) {
          const slide = event.target.closest(".std-slider-slide");
          const index = slide ? slides.indexOf(slide) : -1;

          if (index >= 0) {
            const targetLeft = index * step;
            const visibleRight = offset + viewport.clientWidth - 10;

            if (targetLeft < offset || targetLeft > visibleRight) {
              animateTo(clamp(targetLeft, 0, getMaxOffset()), {
                ease: "inOut"
              });
            }
          }
        }
      });

      slider.addEventListener("focusout", function (event) {
        if (event.relatedTarget && slider.contains(event.relatedTarget)) {
          return;
        }

        isFocused = false;
        scheduleAutoSlide();
      });

      viewport.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveSlider(-1);
          restartAutoSlide();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveSlider(1);
          restartAutoSlide();
        }
      });

      window.addEventListener("resize", function () {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(layoutSlider);
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          cancelAnimation();
          clearAutoSlide();
        } else {
          scheduleAutoSlide();
        }
      });

      reducedMotion.addEventListener("change", function () {
        cancelAnimation();
        restartAutoSlide();
      });

      layoutSlider();
    });
  });
})();

(function () {
  window.Webflow = window.Webflow || [];

  window.Webflow.push(function () {
    'use strict';

    const duration = 280;
    const easing = 'ease-in-out';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('.faq-gridbox').forEach(function (box, index) {
      const title = box.querySelector('.faq-gridbox-title-wrapper');

      const content = box.querySelector('.faq-gridbox-content-wrapper');

      if (!title || !content) return;

      const contentId = content.id || 'faq-grid-content-' + (index + 1);

      const titleId = title.id || 'faq-grid-title-' + (index + 1);

      content.id = contentId;
      title.id = titleId;

      /*
       * Beide Wrapper liegen in derselben Grid-Zelle.
       * Trotzdem bleiben beide im Layout und die größere
       * Höhe bestimmt automatisch die Höhe der Box.
       */
      box.style.display = 'grid';

      title.style.gridArea = '1 / 1';
      content.style.gridArea = '1 / 1';

      title.style.zIndex = '1';
      content.style.zIndex = '2';

      title.style.cursor = 'pointer';
      content.style.cursor = 'pointer';

      if (!reducedMotion) {
        const transition = 'opacity ' + duration + 'ms ' + easing + ', transform ' + duration + 'ms ' + easing;

        title.style.transition = transition;
        content.style.transition = transition;
      }

      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      title.setAttribute('aria-controls', contentId);
      title.setAttribute('aria-expanded', 'false');

      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', titleId);

      function setOpen(open) {
        box.classList.toggle('is-open', open);

        title.setAttribute('aria-expanded', String(open));

        content.setAttribute('aria-hidden', String(!open));

        content.inert = !open;

        title.style.opacity = open ? '0' : '1';
        title.style.transform = open ? 'translateY(-12px)' : 'translateY(0)';
        title.style.pointerEvents = open ? 'none' : 'auto';

        content.style.opacity = open ? '1' : '0';
        content.style.transform = open ? 'translateY(0)' : 'translateY(12px)';
        content.style.pointerEvents = open ? 'auto' : 'none';
      }

      function toggle() {
        const isOpen = title.getAttribute('aria-expanded') === 'true';

        setOpen(!isOpen);
      }

      setOpen(false);

      title.addEventListener('click', toggle);

      title.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });

      content.addEventListener('click', function (event) {
        if (event.target.closest('a, button, input, select, textarea, label')) {
          return;
        }

        setOpen(false);
      });

      content.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          title.focus();
        }
      });
    });
  });
})();

(function () {
  /*
   * Paralax Effect
   */
  window.Webflow = window.Webflow || [];

  window.Webflow.push(function () {
    'use strict';

    const PARALLAX_EXTRA = 0.3;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) return;

    const items = Array.from(document.querySelectorAll('.fullbody-section-image-wrapper.is-paralax'))
      .map(function (wrapper) {
        const image = wrapper.querySelector('.fullbody-image');

        if (!image) return null;

        wrapper.style.overflow = 'hidden';

        image.style.position = 'absolute';
        image.style.top = -(PARALLAX_EXTRA / 2) * 100 + '%';
        image.style.left = '0';
        image.style.width = '100%';
        image.style.height = (1 + PARALLAX_EXTRA) * 100 + '%';
        image.style.maxWidth = 'none';
        image.style.objectFit = 'cover';
        image.style.willChange = 'transform';

        return {
          wrapper: wrapper,
          image: image,
        };
      })
      .filter(Boolean);

    if (!items.length) return;

    let ticking = false;

    function updateParallax() {
      const viewportHeight = window.innerHeight;

      items.forEach(function (item) {
        const rect = item.wrapper.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > viewportHeight) {
          return;
        }

        const scrollProgress = (viewportHeight - rect.top) / (viewportHeight + rect.height);

        const limitedProgress = Math.max(0, Math.min(1, scrollProgress));

        const movement = (limitedProgress - 0.5) * rect.height * PARALLAX_EXTRA;

        item.image.style.transform = 'translate3d(0, ' + movement + 'px, 0)';
      });

      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(updateParallax);
    }

    updateParallax();

    window.addEventListener('scroll', requestUpdate, {
      passive: true,
    });

    window.addEventListener('resize', requestUpdate);
  });
})();
