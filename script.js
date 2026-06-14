const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopViewport = window.matchMedia("(min-width: 720px)");
const animatedItems = document.querySelectorAll("[data-animate]");
const slides = [...document.querySelectorAll(".hero-slide")];
const dots = [...document.querySelectorAll(".slider-dot")];
const nextButton = document.querySelector(".slider-next");
const slider = document.querySelector(".hero-slider");
const siteHeader = document.querySelector(".site-header");
const actionDock = document.querySelector(".action-dock");
const hallsSection = document.querySelector("#halls");
const hallGalleries = [...document.querySelectorAll("[data-hall-gallery]")];
const storySection = document.querySelector("#spa-story");
const hallPrices = [...document.querySelectorAll(".hall-price")];
const reviewsSlider = document.querySelector("[data-reviews-slider]");
const lightbox = document.querySelector(".photo-lightbox");
const lightboxImage = document.querySelector(".photo-lightbox-image");
const lightboxClose = document.querySelector(".photo-lightbox-close");
const lightboxPrevious = document.querySelector(".photo-lightbox-prev");
const lightboxNext = document.querySelector(".photo-lightbox-next");
const lightboxCount = document.querySelector(".photo-lightbox-count");
const lightboxCaption = document.querySelector(".photo-lightbox-caption");
const viewableImages = [...document.querySelectorAll(".hero-slide img, .hall-media-slide, .gallery-item img, .spa-story-image")];
const imageLightboxGroups = new Map();

const registerLightboxGroup = (images) => {
  const groupImages = [...images];
  const items = groupImages.map((image) => ({
    src: image.currentSrc || image.src,
    alt: image.alt,
  }));

  groupImages.forEach((image, index) => {
    imageLightboxGroups.set(image, { items, index });
  });
};

[
  document.querySelectorAll(".hero-slide img"),
  ...hallGalleries.map((gallery) => gallery.querySelectorAll(".hall-media-slide")),
  document.querySelectorAll(".gallery-item img"),
  document.querySelectorAll(".spa-story-image"),
].forEach(registerLightboxGroup);

let activeSlide = 0;
let autoPlayTimer = null;
let touchStartX = 0;
let lastScrollY = window.scrollY;
let storyIsVisible = false;
let storyFrame = null;
let lightboxIndex = 0;
let lightboxTouchStartX = 0;
let lightboxTouchStartY = 0;
let lightboxItems = [];
let lightboxIsTransitioning = false;
let lightboxTransitionId = 0;

const showSlide = (index) => {
  activeSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeSlide);
  });

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeSlide;
    dot.classList.toggle("is-active", isActive);
    dot.toggleAttribute("aria-current", isActive);
  });
};

const stopAutoPlay = () => {
  if (autoPlayTimer) {
    window.clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
};

const startAutoPlay = () => {
  stopAutoPlay();

  if (!reducedMotion.matches && desktopViewport.matches) {
    autoPlayTimer = window.setInterval(() => {
      showSlide(activeSlide + 1);
    }, 6000);
  }
};

const revealAnimatedItems = () => {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    animatedItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
  );

  animatedItems.forEach((item) => revealObserver.observe(item));
};

const setupHallGalleries = () => {
  hallGalleries.forEach((gallery) => {
    const hallSlides = [...gallery.querySelectorAll(".hall-media-slide")];
    const hallDots = [...gallery.querySelectorAll(".hall-media-dot")];
    const previousButton = gallery.querySelector(".hall-media-prev");
    const nextHallButton = gallery.querySelector(".hall-media-next");
    const hallMedia = gallery.querySelector(".hall-media");
    let currentIndex = 0;
    let hallTouchStartX = 0;

    const showHallSlide = (index) => {
      currentIndex = (index + hallSlides.length) % hallSlides.length;

      hallSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === currentIndex);
      });

      hallDots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle("is-active", isActive);
        dot.toggleAttribute("aria-current", isActive);
      });
    };

    previousButton?.addEventListener("click", () => showHallSlide(currentIndex - 1));
    nextHallButton?.addEventListener("click", () => showHallSlide(currentIndex + 1));

    hallDots.forEach((dot, index) => {
      dot.addEventListener("click", () => showHallSlide(index));
    });

    hallMedia?.addEventListener(
      "touchstart",
      (event) => {
        hallTouchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    hallMedia?.addEventListener(
      "touchend",
      (event) => {
        const deltaX = event.changedTouches[0].clientX - hallTouchStartX;

        if (Math.abs(deltaX) >= 42) {
          showHallSlide(currentIndex + (deltaX < 0 ? 1 : -1));
        }
      },
      { passive: true }
    );

    showHallSlide(0);
  });
};

const updateStoryParallax = () => {
  storyFrame = null;

  if (!storySection || !storyIsVisible || reducedMotion.matches) {
    return;
  }

  const rect = storySection.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  const maxShift = desktopViewport.matches ? 36 : 18;
  const shift = (normalizedProgress - 0.5) * maxShift * 2;

  storySection.style.setProperty("--story-shift", `${shift.toFixed(2)}px`);
};

const requestStoryParallax = () => {
  if (!storyFrame) {
    storyFrame = window.requestAnimationFrame(updateStoryParallax);
  }
};

const setupStoryParallax = () => {
  if (!storySection || reducedMotion.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const storyObserver = new IntersectionObserver((entries) => {
    storyIsVisible = entries[0].isIntersecting;
    requestStoryParallax();
  });

  storyObserver.observe(storySection);
  window.addEventListener("scroll", requestStoryParallax, { passive: true });
  window.addEventListener("resize", requestStoryParallax);
};

const setupReviewsSlider = () => {
  if (!reviewsSlider) {
    return;
  }

  const reviewCards = [...reviewsSlider.querySelectorAll(".review-card")];
  const reviewDots = [...reviewsSlider.querySelectorAll(".review-dot")];
  const previousReview = reviewsSlider.querySelector(".review-prev");
  const nextReview = reviewsSlider.querySelector(".review-next");
  let currentReview = 0;
  let reviewTouchStartX = 0;

  const showReview = (index) => {
    currentReview = (index + reviewCards.length) % reviewCards.length;

    reviewCards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === currentReview);
    });

    reviewDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentReview;
      dot.classList.toggle("is-active", isActive);
      dot.toggleAttribute("aria-current", isActive);
    });
  };

  previousReview?.addEventListener("click", () => showReview(currentReview - 1));
  nextReview?.addEventListener("click", () => showReview(currentReview + 1));

  reviewDots.forEach((dot, index) => {
    dot.addEventListener("click", () => showReview(index));
  });

  reviewsSlider.addEventListener(
    "touchstart",
    (event) => {
      reviewTouchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  reviewsSlider.addEventListener(
    "touchend",
    (event) => {
      const deltaX = event.changedTouches[0].clientX - reviewTouchStartX;

      if (Math.abs(deltaX) >= 42) {
        showReview(currentReview + (deltaX < 0 ? 1 : -1));
      }
    },
    { passive: true }
  );

  showReview(0);
};

const updateLightboxItem = (index) => {
  if (!lightboxImage || !lightboxItems.length) {
    return;
  }

  lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
  const item = lightboxItems[lightboxIndex];

  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  lightboxCaption.textContent = item.alt;
  lightboxCount.textContent = `${lightboxIndex + 1} из ${lightboxItems.length}`;
};

const waitForLightboxImage = () => {
  if (!lightboxImage || lightboxImage.complete) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    lightboxImage.addEventListener("load", resolve, { once: true });
    lightboxImage.addEventListener("error", resolve, { once: true });
  });
};

const waitForAnimation = async (animation) => {
  try {
    await animation.finished;
  } catch {
    // Removing an animated element while closing the lightbox cancels its animation.
  }
};

const animateLightboxOpen = async (sourceRect) => {
  if (!lightboxImage || reducedMotion.matches || !lightboxImage.animate) {
    lightboxImage?.classList.remove("is-transitioning");
    return;
  }

  await waitForLightboxImage();

  const targetRect = lightboxImage.getBoundingClientRect();
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const translateX = sourceCenterX - targetCenterX;
  const translateY = sourceCenterY - targetCenterY;
  const scaleX = sourceRect.width / targetRect.width;
  const scaleY = sourceRect.height / targetRect.height;

  lightboxImage.classList.remove("is-transitioning");

  const animation = lightboxImage.animate(
    [
      {
        opacity: 0.88,
        transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`,
      },
      {
        opacity: 1,
        transform: "translate(0, 0) scale(1, 1)",
      },
    ],
    {
      duration: 520,
      easing: "cubic-bezier(0.22, 0.74, 0.22, 1)",
    }
  );

  await waitForAnimation(animation);
};

const showLightboxItem = async (index, direction = 1) => {
  if (!lightboxImage || !lightboxItems.length || lightboxIsTransitioning) {
    return;
  }

  const nextIndex = (index + lightboxItems.length) % lightboxItems.length;

  if (nextIndex === lightboxIndex) {
    return;
  }

  lightboxIsTransitioning = true;
  const transitionId = ++lightboxTransitionId;

  if (!reducedMotion.matches && lightboxImage.animate) {
    const exitAnimation = lightboxImage.animate(
      [
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0.24, transform: `translateX(${direction > 0 ? -30 : 30}px)` },
      ],
      {
        duration: 180,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
      }
    );

    await waitForAnimation(exitAnimation);
  }

  if (transitionId !== lightboxTransitionId || !lightbox.classList.contains("is-visible")) {
    return;
  }

  updateLightboxItem(nextIndex);
  await waitForLightboxImage();

  if (transitionId !== lightboxTransitionId || !lightbox.classList.contains("is-visible")) {
    return;
  }

  if (!reducedMotion.matches && lightboxImage.animate) {
    const enterAnimation = lightboxImage.animate(
      [
        { opacity: 0.24, transform: `translateX(${direction > 0 ? 30 : -30}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      {
        duration: 300,
        easing: "cubic-bezier(0.22, 0.74, 0.22, 1)",
      }
    );

    await waitForAnimation(enterAnimation);
  }

  lightboxIsTransitioning = false;
};

const openLightbox = async (source) => {
  const group = imageLightboxGroups.get(source);

  if (!lightbox || !lightboxImage || !group) {
    return;
  }

  const sourceRect = source.getBoundingClientRect();

  lightboxItems = group.items;
  lightboxIsTransitioning = true;
  const transitionId = ++lightboxTransitionId;
  lightboxImage.classList.add("is-transitioning");

  lightbox.classList.add("is-visible");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");
  updateLightboxItem(group.index);
  await animateLightboxOpen(sourceRect);

  if (transitionId === lightboxTransitionId) {
    lightboxIsTransitioning = false;
  }
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage || !lightbox.classList.contains("is-visible")) {
    return;
  }

  lightboxIsTransitioning = false;
  lightboxTransitionId += 1;
  lightbox.classList.remove("is-visible");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.classList.remove("is-transitioning");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.classList.remove("is-lightbox-open");
};

const setupPhotoLightbox = () => {
  viewableImages.forEach((image) => {
    image.addEventListener("click", () => openLightbox(image));
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxPrevious?.addEventListener("click", () => showLightboxItem(lightboxIndex - 1, -1));
  lightboxNext?.addEventListener("click", () => showLightboxItem(lightboxIndex + 1, 1));

  lightbox?.addEventListener("click", closeLightbox);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }

    if (lightbox?.classList.contains("is-visible") && event.key === "ArrowLeft") {
      showLightboxItem(lightboxIndex - 1, -1);
    }

    if (lightbox?.classList.contains("is-visible") && event.key === "ArrowRight") {
      showLightboxItem(lightboxIndex + 1, 1);
    }
  });

  lightbox?.addEventListener(
    "touchstart",
    (event) => {
      lightboxTouchStartX = event.changedTouches[0].clientX;
      lightboxTouchStartY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );

  lightbox?.addEventListener(
    "touchend",
    (event) => {
      const deltaX = event.changedTouches[0].clientX - lightboxTouchStartX;
      const deltaY = event.changedTouches[0].clientY - lightboxTouchStartY;

      if (!desktopViewport.matches && Math.abs(deltaY) >= 64 && Math.abs(deltaY) > Math.abs(deltaX)) {
        closeLightbox();
        return;
      }

      if (Math.abs(deltaX) >= 42) {
        const direction = deltaX < 0 ? 1 : -1;
        showLightboxItem(lightboxIndex + direction, direction);
      }
    },
    { passive: true }
  );

  lightboxImage?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  [lightboxPrevious, lightboxNext, lightboxClose].forEach((button) => {
    button?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
};

const revealHallPrices = () => {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    return;
  }

  const priceObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-shimmering");
          priceObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.8 }
  );

  hallPrices.forEach((price) => priceObserver.observe(price));
};

const updateFloatingControls = () => {
  if (!hallsSection) {
    return;
  }

  if (desktopViewport.matches) {
    actionDock?.classList.remove("is-hidden");
    siteHeader?.classList.remove("is-hidden");
    lastScrollY = window.scrollY;
    return;
  }

  const currentScrollY = window.scrollY;
  const hallsStart = hallsSection.offsetTop;
  const isBeforeHalls = currentScrollY < hallsStart - 24;
  const isScrollingUp = currentScrollY < lastScrollY;
  const shouldHide = !isBeforeHalls && !isScrollingUp;

  actionDock?.classList.toggle("is-hidden", shouldHide);
  siteHeader?.classList.toggle("is-hidden", shouldHide);
  lastScrollY = currentScrollY;
};

nextButton?.addEventListener("click", () => {
  showSlide(activeSlide + 1);
  startAutoPlay();
});

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showSlide(index);
    startAutoPlay();
  });
});

slider?.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].clientX;
  },
  { passive: true }
);

slider?.addEventListener(
  "touchend",
  (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(deltaX) >= 42) {
      showSlide(activeSlide + (deltaX < 0 ? 1 : -1));
      startAutoPlay();
    }
  },
  { passive: true }
);

window.addEventListener("scroll", updateFloatingControls, { passive: true });
desktopViewport.addEventListener("change", () => {
  startAutoPlay();
  updateFloatingControls();
});
reducedMotion.addEventListener("change", startAutoPlay);

showSlide(0);
revealAnimatedItems();
setupHallGalleries();
setupStoryParallax();
setupReviewsSlider();
setupPhotoLightbox();
revealHallPrices();
updateFloatingControls();
startAutoPlay();
