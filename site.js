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

  /*
   * Mega Menu – Ergänzungen
   * 1) Klick außerhalb schließt das offene Menü
   * 2) Shift+Tab führt exakt den Tab-Weg zurück (erster Panel-Link -> Auslöse-Button)
   */
  (function () {
    onReady(function () {
      "use strict";

      var megaNav = document.querySelector('[data-mega-nav="true"]');
      if (!megaNav) return;

      var triggers = Array.from(
        megaNav.querySelectorAll(".nav_menu-trigger[data-mega-trigger]")
      );

      var solutionsPanel = document.getElementById("mega-loesungen");

      var sectionButtons = solutionsPanel
        ? Array.from(solutionsPanel.querySelectorAll("button[data-mega-section]"))
        : [];

      /* ---- 1) Klick außerhalb schließt das offene Menü ---- */
      document.addEventListener("click", function (event) {
        // Klicks innerhalb der Navigation (inkl. Panels) ignorieren
        if (megaNav.contains(event.target)) return;

        var openTrigger = triggers.find(function (trigger) {
          return trigger.getAttribute("aria-expanded") === "true";
        });

        // Bestehende Schließ-Logik des Triggers wiederverwenden (inkl. Animation)
        if (openTrigger) openTrigger.click();
      });

      /* ---- 2) Shift+Tab: sauberer Rückweg zum Auslöse-Button ---- */
      function getFirstFocusable(container) {
        if (!container) return null;
        return container.querySelector(
          [
            'a[href]:not([tabindex="-1"])',
            'button:not([disabled]):not([tabindex="-1"])',
            'input:not([disabled]):not([tabindex="-1"])',
            '[tabindex]:not([tabindex="-1"])'
          ].join(",")
        );
      }

      sectionButtons.forEach(function (button) {
        var panelIds = (button.getAttribute("aria-controls") || "")
          .split(/\s+/)
          .filter(Boolean);

        var panels = panelIds
          .map(function (id) {
            return document.getElementById(id);
          })
          .filter(Boolean);

        function firstFocusableAcrossPanels() {
          for (var i = 0; i < panels.length; i++) {
            var el = getFirstFocusable(panels[i]);
            if (el) return el;
          }
          return null;
        }

        panels.forEach(function (panel) {
          panel.addEventListener("keydown", function (event) {
            if (event.key !== "Tab" || !event.shiftKey) return;
            if (button.getAttribute("aria-expanded") !== "true") return;

            // Nur beim ersten Element des Panels zurück auf den Button springen.
            // Alle weiteren Rückwärts-Schritte laufen bereits natürlich in
            // DOM-Reihenfolge und spiegeln damit den Hin-Weg.
            if (event.target !== firstFocusableAcrossPanels()) return;

            event.preventDefault();
            button.focus();
          });
        });
      });
    });
  })();

  /*
   * Logo Trust Slider – getaktetes Endlos-Marquee, from scratch
   * - alle 3s eine .logo-trust-slide nach links (ease-in-out 250ms)
   * - nahtloser Loop über Klone + Offset-Wrap
   * - Pause bei Hover/Drag, geschmeidiger Drag mit Einrasten
   * - Gradienten übernehmen die Hintergrundfarbe der Eltern-.udesly-section
   * - Slide-Breite kommt aus dem Webflow-CSS (wird nur gelesen)
   */
  (function () {
    onReady(function () {
      "use strict";

      /* ---- Feintuning ---- */
      var AUTO_INTERVAL = 3000;   // ms zwischen den Schritten
      var STEP_DURATION = 250;    // ms für einen Auto-Schritt (ease-in-out)
      var SNAP_DURATION = 250;    // ms fürs Einrasten nach dem Drag
      var AXIS_LOCK = 6;          // px bis die Wischrichtung feststeht
      var FLICK_PROJECTION = 90;  // ms Nachlauf der Wischgeschwindigkeit

      var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

      document.querySelectorAll(".logo-trust-slider").forEach(function (slider) {
        var mask = slider.querySelector(".logo-trust-slider-mask");
        if (!mask) return;

        var originalSlides = Array.prototype.slice.call(
          mask.querySelectorAll(".logo-trust-slide")
        );
        if (!originalSlides.length) return;

        var gradients = Array.prototype.slice.call(
          mask.querySelectorAll(".logo-trust-slider-mask-gradient")
        );

        /* Gap aus dem ursprünglichen (Flex-)Zustand der Maske lesen,
           bevor wir sie überschreiben. */
        var maskStyles = window.getComputedStyle(mask);
        var gap =
          parseFloat(maskStyles.columnGap || maskStyles.gap) || 0;

        /* ---- Track anlegen und Slides hineinlegen ---- */
        var track = document.createElement("div");
        track.className = "logo-trust-slider-track";
        originalSlides.forEach(function (slide) {
          track.appendChild(slide);
        });

        /* Maske: Wrap zur Laufzeit überschreiben, Gradienten bleiben Kinder */
        mask.style.display = "block";
        mask.style.position = "relative";
        mask.style.overflow = "hidden";
        mask.style.cursor = "grab";
        mask.style.touchAction = "pan-y";
        mask.insertBefore(track, mask.firstChild);

        track.style.display = "flex";
        track.style.flexWrap = "nowrap";
        track.style.alignItems = "center";
        track.style.width = "100%";
        track.style.columnGap = gap + "px";
        track.style.willChange = "transform";
        track.style.transform = "translate3d(0,0,0)";
        track.style.userSelect = "none";

        gradients.forEach(function (g) {
          g.style.pointerEvents = "none";
          g.style.zIndex = "2";
        });

        function prepSlide(el) {
          el.style.flexGrow = "0";
          el.style.flexShrink = "0";
          el.querySelectorAll("img").forEach(function (img) {
            img.setAttribute("draggable", "false");
            img.style.webkitUserDrag = "none";
          });
          if (el.tagName === "A") {
            el.addEventListener("dragstart", function (e) {
              e.preventDefault();
            });
          }
        }
        originalSlides.forEach(prepSlide);

        /* ---- Zustand ---- */
        var offset = 0;      // aktuelle Verschiebung (px), immer in [0, setWidth)
        var unit = 0;        // Breite einer Slide inkl. Gap
        var setWidth = 0;    // Breite eines Original-Satzes
        var viewport = 0;

        var animId = null;
        var autoTimer = null;

        var isHovered = false;
        var isVisible = true;
        var isDragging = false;
        var moved = false;
        var suppressClick = false;

        var pointerId = null;
        var axis = null;
        var downX = 0;
        var downY = 0;
        var dragStartOffset = 0;
        var velocity = 0;
        var lastX = 0;
        var lastT = 0;

        function setTransform() {
          track.style.transform = "translate3d(" + -offset + "px,0,0)";
        }

        function wrapOffset() {
          if (setWidth > 0) {
            offset = ((offset % setWidth) + setWidth) % setWidth;
          }
        }

        function cancelAnim() {
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }

        function animateTo(target, duration, done) {
          cancelAnim();
          var start = offset;
          var dist = target - start;

          if (reducedMotion.matches || duration <= 0 || Math.abs(dist) < 0.5) {
            offset = target;
            wrapOffset();
            setTransform();
            if (done) done();
            return;
          }

          var t0 = null;
          function frame(now) {
            if (t0 === null) t0 = now;
            var p = Math.min(1, (now - t0) / duration);
            var e =
              p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOutQuad
            offset = start + dist * e;
            setTransform();
            if (p < 1) {
              animId = requestAnimationFrame(frame);
            } else {
              animId = null;
              offset = target;
              wrapOffset();
              setTransform();
              if (done) done();
            }
          }
          animId = requestAnimationFrame(frame);
        }

        /* ---- Klone aufbauen, damit der Loop lückenlos ist ---- */
        function rebuild() {
          Array.prototype.slice
            .call(track.querySelectorAll('[data-logo-clone="1"]'))
            .forEach(function (n) {
              n.remove();
            });

          viewport = mask.clientWidth;
          unit = originalSlides[0].getBoundingClientRect().width + gap;
          setWidth = originalSlides.length * unit;
          if (!setWidth) return;

          var copies = Math.max(
            1,
            Math.ceil((viewport + 2 * unit) / setWidth)
          );

          for (var c = 0; c < copies; c++) {
            originalSlides.forEach(function (s) {
              var clone = s.cloneNode(true);
              clone.setAttribute("data-logo-clone", "1");
              clone.setAttribute("aria-hidden", "true");
              prepSlide(clone);
              track.appendChild(clone);
            });
          }

          wrapOffset();
          setTransform();
        }

        /* ---- Gradienten an die Section-Farbe angleichen ---- */
        function parseRGBA(str) {
          var m = (str || "").match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          var parts = m[1].split(",").map(function (v) {
            return parseFloat(v);
          });
          return {
            r: parts[0],
            g: parts[1],
            b: parts[2],
            a: parts.length > 3 ? parts[3] : 1
          };
        }

        function effectiveBg(el) {
          while (el) {
            var c = parseRGBA(window.getComputedStyle(el).backgroundColor);
            if (c && c.a > 0) return c;
            el = el.parentElement;
          }
          return { r: 255, g: 255, b: 255, a: 1 };
        }

        function updateGradients() {
          var section = slider.closest(".udesly-section") || slider.parentElement;
          var col = effectiveBg(section);
          var solid = "rgba(" + col.r + "," + col.g + "," + col.b + ",1)";
          var clear = "rgba(" + col.r + "," + col.g + "," + col.b + ",0)";
          var maskRect = mask.getBoundingClientRect();

          gradients.forEach(function (g) {
            var r = g.getBoundingClientRect();
            var center = (r.left + r.right) / 2 - maskRect.left;
            var dir = center < maskRect.width / 2 ? "to right" : "to left";
            g.style.background =
              "linear-gradient(" + dir + ", " + solid + " 0%, " + clear + " 100%)";
          });
        }

        /* ---- Auto-Lauf ---- */
        function autoPaused() {
          return (
            reducedMotion.matches ||
            isHovered ||
            isDragging ||
            document.hidden ||
            !isVisible
          );
        }

        function step() {
          animateTo(offset + unit, STEP_DURATION);
        }

        function stopAuto() {
          window.clearTimeout(autoTimer);
          autoTimer = null;
        }

        function startAuto() {
          stopAuto();
          if (reducedMotion.matches) return;
          autoTimer = window.setTimeout(onTick, AUTO_INTERVAL);
        }

        function onTick() {
          if (!autoPaused()) step();
          autoTimer = window.setTimeout(onTick, AUTO_INTERVAL);
        }

        /* ---- Drag ---- */
        function cleanupPointer() {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
          pointerId = null;
          axis = null;
        }

        mask.addEventListener("pointerdown", function (e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;

          cancelAnim();
          pointerId = e.pointerId;
          downX = e.clientX;
          downY = e.clientY;
          dragStartOffset = offset;
          isDragging = false;
          moved = false;
          axis = null;
          velocity = 0;
          lastX = e.clientX;
          lastT = performance.now();

          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onUp);
        });

        function onMove(e) {
          if (e.pointerId !== pointerId) return;

          var dx = e.clientX - downX;
          var dy = e.clientY - downY;

          if (axis === null) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              axis = "h";
              isDragging = true;
              mask.style.cursor = "grabbing";
              downX = e.clientX;
              dragStartOffset = offset;
              lastX = e.clientX;
              lastT = performance.now();
            } else {
              // Vertikal: Drag verwerfen, Seite scrollt normal.
              cleanupPointer();
              return;
            }
          }

          if (axis !== "h") return;
          moved = true;
          if (e.cancelable) e.preventDefault();

          var raw = dragStartOffset - (e.clientX - downX);
          offset = ((raw % setWidth) + setWidth) % setWidth;
          setTransform();

          var now = performance.now();
          var dt = now - lastT;
          if (dt > 0) {
            var inst = (e.clientX - lastX) / dt;
            velocity = velocity * 0.6 + inst * 0.4;
            lastX = e.clientX;
            lastT = now;
          }
        }

        function onUp() {
          var wasDragging = isDragging;
          cleanupPointer();
          isDragging = false;
          mask.style.cursor = "grab";

          if (moved) {
            suppressClick = true;
            window.setTimeout(function () {
              suppressClick = false;
            }, 120);
          }

          if (wasDragging) {
            // Wischgeschwindigkeit kurz projizieren, dann in die Slide einrasten.
            var projected = offset - velocity * FLICK_PROJECTION;
            var target = Math.round(projected / unit) * unit;
            if (target < 0) {
              // Nahtlos in den geklonten Bereich rechts verschieben.
              offset += setWidth;
              target += setWidth;
              setTransform();
            }
            animateTo(target, SNAP_DURATION);
          } else {
            // Reiner Tap: auf die nächste Slide ausrichten (falls mitten drin gestoppt).
            animateTo(Math.round(offset / unit) * unit, SNAP_DURATION);
          }

          startAuto();
        }

        mask.addEventListener(
          "click",
          function (e) {
            if (!suppressClick) return;
            e.preventDefault();
            e.stopImmediatePropagation();
          },
          true
        );

        /* ---- Pausen ---- */
        slider.addEventListener("mouseenter", function () {
          isHovered = true;
        });
        slider.addEventListener("mouseleave", function () {
          isHovered = false;
          startAuto();
        });

        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (entries) {
            isVisible = entries[0].isIntersecting;
          }).observe(slider);
        }

        document.addEventListener("visibilitychange", function () {
          if (!document.hidden) startAuto();
        });

        reducedMotion.addEventListener("change", function () {
          if (reducedMotion.matches) {
            cancelAnim();
            stopAuto();
          } else {
            startAuto();
          }
        });

        /* ---- Resize ---- */
        var resizeFrame;
        window.addEventListener("resize", function () {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(function () {
            offset = Math.round(offset / (unit || 1)) * (unit || 1);
            rebuild();
            updateGradients();
          });
        });

        /* ---- Start ---- */
        rebuild();
        updateGradients();
        startAuto();
      });
    });
  })();

  /*
   * Hero Hub Square
   * - .hero-hub-square = 50% der Breite von .udesly-container.is-hero.is-hub
   *   (Breite = Höhe -> bleibt quadratisch)
   * - vertikal in der Section zentriert, horizontal rechts
   * - Section: min-height = Quadrat + vertikales Padding + Puffer
   * - < 768px: Script deaktiviert sich und setzt Inline-Styles zurück
   *   (manuelle Mobile-Steuerung im Webflow)
   */
  (function () {
    onReady(function () {
      "use strict";

      /* ---- Feintuning ---- */
      var BREAKPOINT = 768;    // ab hier abwärts übernimmt manuelles CSS
      var EXTRA_BUFFER = 60;   // px zusätzlicher vertikaler Puffer

      var squares = Array.prototype.slice.call(
        document.querySelectorAll(".hero-hub-square")
      );
      if (!squares.length) return;

      var items = squares
        .map(function (square) {
          var container =
            square.closest(".udesly-container.is-hero.is-hub") ||
            square.closest(".udesly-container");
          var section =
            square.closest(".udesly-section.is-hero.is-hub-page") ||
            square.closest(".udesly-section");
          if (!container) return null;
          return { square: square, container: container, section: section };
        })
        .filter(Boolean);

      if (!items.length) return;

      function reset(item) {
        item.square.style.width = "";
        item.square.style.height = "";
        item.square.style.top = "";
        item.square.style.bottom = "";
        item.square.style.transform = "";
        if (item.section) item.section.style.minHeight = "";
      }

      function applyOne(item) {
        var width = item.container.getBoundingClientRect().width;
        if (!width) return;

        var size = width / 2;

        // Quadrat: Breite = Höhe
        item.square.style.width = size + "px";
        item.square.style.height = size + "px";

        // Vertikal zentrieren (überschreibt bottom: 0)
        item.square.style.bottom = "auto";
        item.square.style.top = "50%";
        item.square.style.transform = "translateY(-50%)";

        // Section hoch genug halten + vorhandenes Padding + Puffer
        if (item.section) {
          var cs = window.getComputedStyle(item.section);
          var padTop = parseFloat(cs.paddingTop) || 0;
          var padBottom = parseFloat(cs.paddingBottom) || 0;
          item.section.style.minHeight =
            size + padTop + padBottom + EXTRA_BUFFER + "px";
        }
      }

      var frame = null;
      function scheduleAll() {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          var mobile = window.innerWidth < BREAKPOINT;
          items.forEach(function (item) {
            if (mobile) reset(item);
            else applyOne(item);
          });
        });
      }

      window.addEventListener("resize", scheduleAll);
      window.addEventListener("orientationchange", scheduleAll);
      window.addEventListener("load", scheduleAll);

      scheduleAll();
    });
  })();

  /*
   * FAQ Accordion (schlank)
   * - Klick auf .faq-question-wrapper öffnet/schließt das .faq-element
   * - pro .faq-wrapper ist immer nur ein Element offen; Wrapper sind unabhängig
   * - Pfeil .is-faq-indicatior dreht beim Öffnen nach oben
   */
  (function () {
    onReady(function () {
      "use strict";

      var DURATION = 300; // ms
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      var wrappers = Array.prototype.slice.call(
        document.querySelectorAll(".faq-wrapper")
      );
      if (!wrappers.length) return;

      var uid = 0;

      wrappers.forEach(function (wrapper) {
        var elements = Array.prototype.slice
          .call(wrapper.querySelectorAll(".faq-element"))
          .map(function (el) {
            var header = el.querySelector(".faq-question-wrapper");
            var content = el.querySelector(".faq-content-wrapper");
            var arrow = el.querySelector(".is-faq-indicatior");
            if (!header || !content) return null;
            return { el: el, header: header, content: content, arrow: arrow };
          })
          .filter(Boolean);

        function closeItem(item) {
          if (!item.el.classList.contains("is-open")) return;
          setOpen(item, false);
        }

        function setOpen(item, open) {
          item.el.classList.toggle("is-open", open);
          item.header.setAttribute("aria-expanded", String(open));
          item.content.inert = !open;

          if (item.arrow) {
            item.arrow.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
          }

          var content = item.content;

          if (reduced) {
            content.style.height = open ? "auto" : "0px";
            content.style.overflow = open ? "" : "hidden";
            return;
          }

          content.style.overflow = "hidden";

          if (open) {
            content.style.height = content.scrollHeight + "px";
            var onEnd = function (e) {
              if (e.propertyName !== "height") return;
              content.removeEventListener("transitionend", onEnd);
              if (item.el.classList.contains("is-open")) {
                content.style.height = "auto";
                content.style.overflow = "";
              }
            };
            content.addEventListener("transitionend", onEnd);
          } else {
            // von aktueller Höhe -> 0 (erst px fixieren, dann animieren)
            content.style.height = content.getBoundingClientRect().height + "px";
            content.getBoundingClientRect(); // Reflow erzwingen
            requestAnimationFrame(function () {
              content.style.height = "0px";
            });
          }
        }

        elements.forEach(function (item, index) {
          var contentId =
            item.content.id || "faq-content-" + ++uid;
          item.content.id = contentId;

          item.header.setAttribute("role", "button");
          item.header.setAttribute("tabindex", "0");
          item.header.setAttribute("aria-controls", contentId);
          item.header.setAttribute("aria-expanded", "false");
          item.header.style.cursor = "pointer";

          item.content.setAttribute("role", "region");
          item.content.style.height = "0px";
          item.content.style.overflow = "hidden";
          item.content.inert = true;

          if (!reduced) {
            item.content.style.transition = "height " + DURATION + "ms ease";
            if (item.arrow) {
              item.arrow.style.transition = "transform " + DURATION + "ms ease";
            }
          }

          function toggle() {
            var willOpen = !item.el.classList.contains("is-open");
            // andere im selben Wrapper schließen
            elements.forEach(function (other) {
              if (other !== item) closeItem(other);
            });
            setOpen(item, willOpen);
          }

          item.header.addEventListener("click", toggle);

          item.header.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
          });
        });
      });
    });
  })();

(function () {
  /*
   * Mobile Menu
   */
  onReady(function () {
    "use strict";

    const burgerButton = document.querySelector(".burger-btn");
    const mobileMenu = document.getElementById("nav-primary-menu");

    const solutionsTrigger = document.getElementById(
      "nav-trigger-loesungen"
    );

    const solutionsPanel = document.getElementById(
      "mega-loesungen"
    );

    const solutionsItem = solutionsTrigger
      ? solutionsTrigger.closest(".nav_menu-item")
      : null;

    const megaMenuLayer = document.querySelector(
      ".mega_menu-layer"
    );

    const megaGrid = solutionsPanel
      ? solutionsPanel.querySelector(".mega_menu-grid")
      : null;

    const mobileDetail = document.getElementById(
      "mega_menu-mobile-detail"
    );

    const mobileDetailContent = mobileDetail
      ? mobileDetail.querySelector(
          ".mega_menu-mobile-detail-content"
        )
      : null;

    const mobileBackButton = mobileDetail
      ? mobileDetail.querySelector(
          ".mega_menu-mobile-back"
        )
      : null;

    const sectionButtons = solutionsPanel
      ? Array.from(
          solutionsPanel.querySelectorAll(
            "button[data-mega-section]"
          )
        )
      : [];

    const mobileBreakpoint = window.matchMedia(
      "(max-width: 991px)"
    );

    if (!burgerButton || !mobileMenu) return;

    const burgerIcon = burgerButton.querySelector(
      ".g-material-icon-text"
    );

    let activeWizardTrigger = null;

    /*
     * Ursprüngliche Desktop-Position
     * des kompletten Lösungen-Panels merken.
     */
    let solutionsPlaceholder = null;

    if (
      solutionsPanel &&
      megaMenuLayer &&
      solutionsPanel.parentNode === megaMenuLayer
    ) {
      solutionsPlaceholder =
        document.createComment("mega-loesungen-position");

      megaMenuLayer.insertBefore(
        solutionsPlaceholder,
        solutionsPanel
      );
    }

    /*
     * Ursprüngliche Positionen aller
     * Subpages-/Related-Panels merken.
     */
    const panelRecords = [];

    sectionButtons.forEach(function (button) {
      const controlledIds = (
        button.getAttribute("aria-controls") || ""
      )
        .split(/\s+/)
        .filter(Boolean);

      controlledIds.forEach(function (id) {
        const panel = document.getElementById(id);

        if (!panel || !panel.parentNode) return;

        const placeholder = document.createComment(
          "original-position-" + id
        );

        panel.parentNode.insertBefore(
          placeholder,
          panel
        );

        panelRecords.push({
          panel: panel,
          placeholder: placeholder
        });
      });
    });

    function openMenu() {
      mobileMenu.classList.add("is-open");

      burgerButton.setAttribute(
        "aria-expanded",
        "true"
      );

      burgerButton.setAttribute(
        "aria-label",
        "Menü schließen"
      );

      if (burgerIcon) {
        burgerIcon.textContent = "close";
      }
    }

    function closeMenu() {
      closeWizard(false);

      mobileMenu.classList.remove("is-open");

      burgerButton.setAttribute(
        "aria-expanded",
        "false"
      );

      burgerButton.setAttribute(
        "aria-label",
        "Menü öffnen"
      );

      if (burgerIcon) {
        burgerIcon.textContent = "menu";
      }
    }

    function restoreContentPanels() {
      panelRecords.forEach(function (record) {
        const placeholder = record.placeholder;

        if (!placeholder.parentNode) return;

        placeholder.parentNode.insertBefore(
          record.panel,
          placeholder.nextSibling
        );

        record.panel.hidden = true;
      });
    }

    function openWizard(button) {
      if (
        !mobileBreakpoint.matches ||
        !mobileDetail ||
        !mobileDetailContent ||
        !megaGrid
      ) {
        return;
      }

      /*
       * Falls vorher ein anderer Bereich offen war,
       * zuerst alle Panels zurücksetzen.
       */
      restoreContentPanels();

      sectionButtons.forEach(function (sectionButton) {
        sectionButton.setAttribute(
          "aria-expanded",
          "false"
        );

        sectionButton.classList.remove("is-active");
      });

      activeWizardTrigger = button;

      button.setAttribute(
        "aria-expanded",
        "true"
      );

      button.classList.add("is-active");

      const controlledIds = (
        button.getAttribute("aria-controls") || ""
      )
        .split(/\s+/)
        .filter(Boolean);

      controlledIds.forEach(function (id) {
        const panel = document.getElementById(id);

        if (!panel) return;

        mobileDetailContent.appendChild(panel);
        panel.hidden = false;
      });

      /*
       * Primary-Step für Maus, Tastatur und
       * Screenreader deaktivieren.
       */
      megaGrid.inert = true;
      megaGrid.setAttribute("aria-hidden", "true");

      mobileDetail.hidden = false;

      if (mobileBackButton) {
        window.requestAnimationFrame(function () {
          mobileBackButton.focus();
        });
      }
    }

    function closeWizard(returnFocus) {
      if (!mobileDetail || !megaGrid) return;

      const previousTrigger = activeWizardTrigger;

      restoreContentPanels();

      sectionButtons.forEach(function (button) {
        button.setAttribute(
          "aria-expanded",
          "false"
        );

        button.classList.remove("is-active");
      });

      mobileDetail.hidden = true;

      megaGrid.inert = false;
      megaGrid.removeAttribute("aria-hidden");

      activeWizardTrigger = null;

      if (
        returnFocus &&
        previousTrigger &&
        mobileBreakpoint.matches
      ) {
        window.requestAnimationFrame(function () {
          previousTrigger.focus();
        });
      }
    }

    function moveSolutionsPanel() {
      if (
        !solutionsPanel ||
        !solutionsItem ||
        !megaMenuLayer
      ) {
        return;
      }

      if (mobileBreakpoint.matches) {
        if (
          solutionsPanel.parentNode !== solutionsItem
        ) {
          solutionsItem.appendChild(
            solutionsPanel
          );
        }

        return;
      }

      /*
       * Beim Wechsel auf Desktop:
       * Wizard vollständig zurücksetzen.
       */
      closeWizard(false);

      if (
        solutionsPlaceholder &&
        solutionsPlaceholder.parentNode &&
        solutionsPanel.parentNode !== megaMenuLayer
      ) {
        solutionsPlaceholder.parentNode.insertBefore(
          solutionsPanel,
          solutionsPlaceholder.nextSibling
        );
      }

      closeMenu();
    }

    /*
     * WICHTIG:
     * Capture-Listener fängt den Klick mobil ab,
     * bevor das bestehende Desktop-Mega-Menü-JS
     * seine normale Spaltenlogik ausführt.
     */
    sectionButtons.forEach(function (button) {
      button.addEventListener(
        "click",
        function (event) {
          if (!mobileBreakpoint.matches) return;

          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          openWizard(button);
        },
        true
      );
    });

    if (mobileBackButton) {
      mobileBackButton.addEventListener(
        "click",
        function () {
          closeWizard(true);
        }
      );
    }

    burgerButton.addEventListener(
      "click",
      function () {
        const isOpen =
          burgerButton.getAttribute(
            "aria-expanded"
          ) === "true";

        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      }
    );

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key !== "Escape" &&
          event.key !== "Esc"
        ) {
          return;
        }

        /*
         * Befinden wir uns in Step 2,
         * führt Escape zunächst nur zurück
         * zur Lösungenübersicht.
         */
        if (
          mobileBreakpoint.matches &&
          mobileDetail &&
          !mobileDetail.hidden
        ) {
          event.preventDefault();
          event.stopPropagation();

          closeWizard(true);
        }
      },
      true
    );

    mobileBreakpoint.addEventListener(
      "change",
      moveSolutionsPanel
    );

    moveSolutionsPanel();
  });
})();

  /*
   * Breadcrumbs – dynamisch aus der URL (Staging + Live)
   * - Struktur aus location.pathname (kein body-Attribut nötig)
   * - Zwischen-Link-Form aus der aktuellen URL abgeleitet:
   *     .html-Seite  -> Zwischenpunkte als /pfad.html   (Live)
   *     clean-URL    -> Zwischenpunkte als /pfad        (Staging)
   * - echte URLs + Labels aus der Navigation geerntet (wo vorhanden)
   * - Label nur aus dem Titel-Element (kein Copytext mehr)
   * - Sprach-Vorbereitung: führendes /en/ wird übersprungen
   * - Homepage: blendet sich aus, wenn nur "Start" übrig bliebe
   */
  (function () {
    onReady(function () {
      "use strict";

      var wrappers = Array.prototype.slice.call(
        document.querySelectorAll(".breadcrumb-wrapper")
      );
      if (!wrappers.length) return;

      /* ---- Konfiguration ---- */
      var LABEL_OVERRIDES = {
        // "e2e-produktionsanalyse": "E2E Produktionsanalyse"
      };
      var LANG_CODES = ["de", "en"];
      var START_LABEL = { de: "Start", en: "Start" };
      var GENERIC_LABELS = ["übersicht", "overview", "start", "home"];

      var lang =
        (document.documentElement.lang || "de").toLowerCase().indexOf("en") === 0
          ? "en"
          : "de";

      var nav =
        document.querySelector('[data-mega-nav="true"]') ||
        document.querySelector(".nav_component");

      var urlByPath = {};   // normalisierter Pfad -> echte href
      var labelBySlug = {}; // Slug -> schönes Label

      function cleanText(el) {
        return (el.textContent || "").replace(/\s+/g, " ").trim();
      }

      // Nur den Titel auslesen, nicht den Copytext darunter
      function labelFromEl(el) {
        var specific = el.querySelector(
          ".nav_menu-trigger-text, .mega_menu-link-text, .nav_dropdown-link-text"
        );
        return cleanText(specific || el);
      }

      function normalizePath(href) {
        var path;
        try {
          path = new URL(href, location.origin).pathname;
        } catch (e) {
          return null;
        }
        path = decodeURIComponent(path).toLowerCase();
        path = path.replace(/\/index\.html?$/, "/").replace(/\.html?$/, "");
        if (path.length > 1) path = path.replace(/\/+$/, "");
        return path || "/";
      }

      function lastSlug(path) {
        var parts = path.split("/").filter(Boolean);
        return parts.length ? parts[parts.length - 1] : "";
      }

      if (nav) {
        Array.prototype.forEach.call(
          nav.querySelectorAll("[data-mega-trigger]"),
          function (el) {
            var slug = el.getAttribute("data-mega-trigger");
            if (slug) labelBySlug[slug.toLowerCase()] = labelFromEl(el);
          }
        );
        Array.prototype.forEach.call(
          nav.querySelectorAll("[data-mega-section]"),
          function (el) {
            var slug = el.getAttribute("data-mega-section");
            if (slug) labelBySlug[slug.toLowerCase()] = labelFromEl(el);
          }
        );
        Array.prototype.forEach.call(
          nav.querySelectorAll("a[href]"),
          function (a) {
            var raw = a.getAttribute("href");
            if (!raw || raw.charAt(0) === "#") return;
            var np = normalizePath(raw);
            if (!np) return;
            if (!(np in urlByPath)) urlByPath[np] = raw;

            var slug = lastSlug(np);
            var text = labelFromEl(a);
            if (
              slug &&
              text &&
              !(slug in labelBySlug) &&
              GENERIC_LABELS.indexOf(text.toLowerCase()) === -1
            ) {
              labelBySlug[slug] = text;
            }
          }
        );
      }

      function prettify(slug) {
        return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) {
          return c.toUpperCase();
        });
      }

      function labelFor(slug) {
        if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug];
        if (labelBySlug[slug]) return labelBySlug[slug];
        return prettify(slug);
      }

      /* ---- Link-Form aus der aktuellen URL ableiten ---- */
      var pathname = location.pathname;
      var usesHtml = /\.html?$/i.test(pathname);
      var usesTrailingSlash = !usesHtml && /\/$/.test(pathname);

      function buildHref(cumulative) {
        if (usesHtml) return cumulative + ".html";   // Live
        if (usesTrailingSlash) return cumulative + "/";
        return cumulative;                           // Staging (clean)
      }

      /* ---- Aktuellen Pfad zerlegen ---- */
      var segments = decodeURIComponent(pathname).split("/").filter(Boolean);

      if (segments.length) {
        var last = segments[segments.length - 1].replace(/\.html?$/i, "");
        if (last.toLowerCase() === "index") segments.pop();
        else segments[segments.length - 1] = last;
      }

      var langPrefix = "";
      if (
        segments.length &&
        LANG_CODES.indexOf(segments[0].toLowerCase()) !== -1
      ) {
        langPrefix = segments.shift().toLowerCase();
      }

      var homeHref = "/" + (langPrefix ? langPrefix + "/" : "");

      /* ---- Krümel bauen ---- */
      var crumbs = [{ label: START_LABEL[lang] || "Start", href: homeHref }];
      var cumulative = langPrefix ? "/" + langPrefix : "";

      segments.forEach(function (seg, i) {
        cumulative += "/" + seg;
        var isLast = i === segments.length - 1;
        var href = null;
        if (!isLast) {
          // echte URL aus Nav bevorzugen, sonst aus aktueller URL-Form ableiten
          href = urlByPath[cumulative.toLowerCase()] || buildHref(cumulative);
        }
        crumbs.push({ label: labelFor(seg.toLowerCase()), href: href });
      });

      if (crumbs.length <= 1) {
        wrappers.forEach(function (w) {
          w.style.display = "none";
        });
        return;
      }

      /* ---- DOM aufbauen (bestehende Elemente als Vorlage) ---- */
      wrappers.forEach(function (wrapper) {
        var linkTpl = wrapper.querySelector(".breadcrumb-link");
        var sepTpl = null;
        Array.prototype.forEach.call(wrapper.children, function (child) {
          if (!sepTpl && !child.classList.contains("breadcrumb-link")) {
            sepTpl = child;
          }
        });

        var linkBase = linkTpl
          ? linkTpl.cloneNode(true)
          : (function () {
              var a = document.createElement("a");
              a.className = "breadcrumb-link";
              return a;
            })();
        var sepClone = sepTpl ? sepTpl.cloneNode(true) : null;

        wrapper.removeAttribute("aria-lable");
        wrapper.setAttribute("aria-label", "breadcrumb");
        wrapper.innerHTML = "";

        crumbs.forEach(function (crumb, i) {
          if (i > 0 && sepClone) wrapper.appendChild(sepClone.cloneNode(true));

          var node = linkBase.cloneNode(true);
          node.classList.remove("active");
          node.removeAttribute("aria-current");
          node.textContent = crumb.label;

          if (i === crumbs.length - 1) {
            node.classList.add("active");
            node.setAttribute("aria-current", "page");
            node.removeAttribute("href");
          } else if (crumb.href) {
            node.setAttribute("href", crumb.href);
          }

          wrapper.appendChild(node);
        });
      });
    });
  })();
