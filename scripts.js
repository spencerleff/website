//Toggles the nav menu open/closed
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}


//Opens/closes the Deep Sea Adventure menu
function toggleOceanMenu() {
    const menu = document.getElementById('oceanMenu');
    const toggleBtn = document.querySelector('.ocean-toggle');
    const isOpen = menu.classList.toggle('open');
    toggleBtn.classList.toggle('open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
}

//Closes the ocean menu when clicking outside of it
document.addEventListener('click', e => {
    const menu = document.getElementById('oceanMenu');
    const toggleBtn = document.querySelector('.ocean-toggle');
    if (!menu || !menu.classList.contains('open')) return;
    if (menu.contains(e.target) || toggleBtn.contains(e.target)) return;

    menu.classList.remove('open');
    toggleBtn.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
});

//Flips the Ocean Mode switch on/off, toggling the landing-page scene
function toggleOceanMode() {
    const oceanSwitch = document.getElementById('oceanSwitch');
    const isOn = oceanSwitch.getAttribute('aria-checked') === 'true';
    const next = !isOn;
    oceanSwitch.setAttribute('aria-checked', String(next));
    document.body.classList.toggle('ocean-mode-active', next);

    try {
        localStorage.setItem(OCEAN_MODE_KEY, next ? '1' : '0');
    } catch {
        //Storage can be unavailable in some private-browsing contexts; fail silently
    }

    if (next) {
        renderAllOceanCreatures();
        refreshAllOceanCreatures();
        startOceanBubbles();
    } else {
        stopOceanBubbles();
    }

    updateOceanChromeContrast();
}

//Deep Sea Adventure: capsule spin, creature unlocks, and 24hr cooldown
const OCEAN_CREATURES = ['fish', 'frog', 'jellyfish', 'otter', 'shark', 'starfish', 'whale', 'whaleshark'];
const OCEAN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const OCEAN_LAST_SPIN_KEY = 'oceanLastSpin';
const OCEAN_UNLOCKED_KEY = 'oceanUnlocked';
const OCEAN_MODE_KEY = 'oceanModeActive';
const OCEAN_POSITIONS_KEY = 'oceanPositions';

//Reads the list of already-unlocked creatures from storage
function getOceanUnlocked() {
    try {
        const stored = JSON.parse(localStorage.getItem(OCEAN_UNLOCKED_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

//Saves the list of unlocked creatures
function setOceanUnlocked(list) {
    try {
        localStorage.setItem(OCEAN_UNLOCKED_KEY, JSON.stringify(list));
    } catch {
        //Storage can be unavailable in some private-browsing contexts; fail silently
    }
}

//Applies saved unlock state to the grid on load
function applyOceanUnlockedState() {
    getOceanUnlocked().forEach(name => {
        const slot = document.querySelector(`.ocean-creature-slot[data-creature="${name}"]`);
        if (slot) slot.classList.add('is-unlocked');
    });
}
applyOceanUnlockedState();

//Reads the saved on-screen position (top/left %) for each placed creature
function getOceanPositions() {
    try {
        const stored = JSON.parse(localStorage.getItem(OCEAN_POSITIONS_KEY) || '{}');
        return (stored && typeof stored === 'object') ? stored : {};
    } catch {
        return {};
    }
}

//Saves the on-screen position map
function setOceanPositions(map) {
    try {
        localStorage.setItem(OCEAN_POSITIONS_KEY, JSON.stringify(map));
    } catch {
        //Storage can be unavailable in some private-browsing contexts; fail silently
    }
}

//Assigns a creature a random spot above the sand line the first time it's placed, then reuses it
function getOrCreateOceanPosition(name) {
    const positions = getOceanPositions();
    if (!positions[name]) {
        positions[name] = {
            top: 8 + Math.random() * 54,
            left: 6 + Math.random() * 82
        };
        setOceanPositions(positions);
    }
    return positions[name];
}

const oceanCreaturesLayer = document.getElementById('oceanCreatures');

//Returns the scene's current pixel box plus how far down (in px) the sand line sits within it
function getOceanSceneMetrics() {
    const sceneEl = document.getElementById('oceanScene');
    if (!sceneEl) return null;

    const sceneRect = sceneEl.getBoundingClientRect();
    if (!sceneRect.width || !sceneRect.height) return null;

    const floorEl = document.querySelector('.ocean-floor');
    const sandTopPx = floorEl
        ? floorEl.getBoundingClientRect().top - sceneRect.top
        : sceneRect.height;

    return { sceneRect, sandTopPx };
}

//Picks the size multiplier for creatures based on the current display resolution
function getOceanCreatureScaleFactor() {
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const isFullHdOrAbove = maxDim >= 1920 && minDim >= 1080;
    return isFullHdOrAbove ? 0.4 : 0.25;
}

//Scales ocean creature sizes
function applyOceanCreatureScale(img) {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    if (!naturalWidth || !naturalHeight) return;

    let width = naturalWidth * getOceanCreatureScaleFactor();

    const metrics = getOceanSceneMetrics();
    if (metrics) {
        const aspect = naturalWidth / naturalHeight;
        const maxWidth = metrics.sceneRect.width * 0.3;
        const maxHeight = metrics.sceneRect.height * 0.3;

        width = Math.min(width, maxWidth);
        if (width / aspect > maxHeight) width = maxHeight * aspect;
    }

    img.style.width = `${width}px`;
}

//Clamp rendered creatures inside of the display area
function clampOceanCreaturePosition(img, topPercent, leftPercent) {
    const metrics = getOceanSceneMetrics();
    if (!metrics) return { top: topPercent, left: leftPercent };

    const { sceneRect, sandTopPx } = metrics;
    const imgRect = img.getBoundingClientRect();
    const w = imgRect.width || 0;
    const h = imgRect.height || 0;

    //A little breathing room above the sand line
    const sandBuffer = 4;

    const minLeftPx = 0;
    const maxLeftPx = Math.max(minLeftPx, sceneRect.width - w);
    const minTopPx = 0;
    const maxTopPx = Math.max(minTopPx, sandTopPx - h - sandBuffer);

    let leftPx = (leftPercent / 100) * sceneRect.width;
    let topPx = (topPercent / 100) * sceneRect.height;

    leftPx = Math.max(minLeftPx, Math.min(maxLeftPx, leftPx));
    topPx = Math.max(minTopPx, Math.min(maxTopPx, topPx));

    return {
        top: (topPx / sceneRect.height) * 100,
        left: (leftPx / sceneRect.width) * 100
    };
}

//Nudges a creature to a new spot with a slow, drifting swim - always staying within the water
function wanderOceanCreature(img, name) {
    const currentTop = parseFloat(img.style.top) || 0;
    const currentLeft = parseFloat(img.style.left) || 0;

    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 25;

    const nextTop = currentTop + Math.sin(angle) * distance;
    const nextLeft = currentLeft + Math.cos(angle) * distance;

    const clamped = clampOceanCreaturePosition(img, nextTop, nextLeft);

    img.style.top = `${clamped.top}%`;
    img.style.left = `${clamped.left}%`;

    const positions = getOceanPositions();
    positions[name] = { top: clamped.top, left: clamped.left };
    setOceanPositions(positions);
}

//Keeps a creature drifting every 8-16 seconds while Ocean Mode stays on, with a slow swim between spots
function scheduleOceanCreatureWander(img, name) {
    const delay = 8000 + Math.random() * 8000;
    setTimeout(() => {
        if (!document.body.classList.contains('ocean-mode-active') || !img.isConnected) return;
        wanderOceanCreature(img, name);
        scheduleOceanCreatureWander(img, name);
    }, delay);
}

//Places a single unlocked creature into the scene, skipping ones already placed
function renderOceanCreature(name) {
    if (!oceanCreaturesLayer) return;
    if (oceanCreaturesLayer.querySelector(`[data-ocean-creature="${name}"]`)) return;

    const pos = getOrCreateOceanPosition(name);
    const img = document.createElement('img');
    img.alt = name;
    img.className = 'ocean-creature-asset';
    img.dataset.oceanCreature = name;
    img.style.top = `${pos.top}%`;
    img.style.left = `${pos.left}%`;

    img.onload = () => {
        applyOceanCreatureScale(img);
        const clamped = clampOceanCreaturePosition(img, pos.top, pos.left);
        img.style.top = `${clamped.top}%`;
        img.style.left = `${clamped.left}%`;
    };
    img.src = `Images/${name}.png`;

    oceanCreaturesLayer.appendChild(img);
    scheduleOceanCreatureWander(img, name);
}

//Places every already-unlocked creature into the scene
function renderAllOceanCreatures() {
    getOceanUnlocked().forEach(renderOceanCreature);
}

//Rescales and re-clamps every placed creature after a viewport/orientation change
function refreshAllOceanCreatures() {
    if (!oceanCreaturesLayer) return;
    oceanCreaturesLayer.querySelectorAll('.ocean-creature-asset').forEach(img => {
        applyOceanCreatureScale(img);
        const name = img.dataset.oceanCreature;
        const clamped = clampOceanCreaturePosition(img, parseFloat(img.style.top) || 0, parseFloat(img.style.left) || 0);
        img.style.top = `${clamped.top}%`;
        img.style.left = `${clamped.left}%`;

        const positions = getOceanPositions();
        if (positions[name]) {
            positions[name] = clamped;
            setOceanPositions(positions);
        }
    });
}

let oceanResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(oceanResizeTimer);
    oceanResizeTimer = setTimeout(refreshAllOceanCreatures, 150);
});

const OCEAN_MAX_BUBBLES = 5;
const oceanBubblesLayer = document.getElementById('oceanBubbles');
let oceanBubbleTimer = null;

//Spawns one cartoon bubble at a random spot, letting its own animation clean it up when it pops
function spawnOceanBubble() {
    if (!oceanBubblesLayer) return;
    if (oceanBubblesLayer.children.length >= OCEAN_MAX_BUBBLES) return;

    const bubble = document.createElement('div');
    bubble.className = 'ocean-bubble';

    const size = (10 + Math.random() * 22) * 1.75;
    const rawDuration = 5 + Math.random() * 4;
    const duration = Math.round((rawDuration * 0.9) * 2) / 2;
    const drift = Math.random() * 24 - 12;
    const left = 5 + Math.random() * 88;

    //Spawn anywhere across the water, but never down in the sand
    const metrics = getOceanSceneMetrics();
    let maxTopPercent = 88;
    if (metrics && metrics.sceneRect.height) {
        maxTopPercent = Math.max(6, (metrics.sandTopPx / metrics.sceneRect.height) * 100 - 4);
    }
    const top = 4 + Math.random() * Math.max(2, maxTopPercent - 4);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.setProperty('--bubble-top', `${top}%`);
    bubble.style.setProperty('--bubble-duration', `${duration}s`);
    bubble.style.setProperty('--bubble-drift', `${drift}px`);

    bubble.addEventListener('animationend', () => bubble.remove());
    oceanBubblesLayer.appendChild(bubble);
}

//Keeps a steady trickle of bubbles going while Ocean Mode is on, respecting the on-screen cap
function startOceanBubbles() {
    if (oceanBubbleTimer) return;

    const tick = () => {
        spawnOceanBubble();
        oceanBubbleTimer = setTimeout(tick, 1200 + Math.random() * 1800);
    };
    tick();
}

//Stops spawning and clears any bubbles currently on screen
function stopOceanBubbles() {
    if (oceanBubbleTimer) {
        clearTimeout(oceanBubbleTimer);
        oceanBubbleTimer = null;
    }
    if (oceanBubblesLayer) oceanBubblesLayer.innerHTML = '';
}

//Keeps the nav and ocean toggle legible: light icons only while Ocean Mode is on and Home is in view
function updateOceanChromeContrast() {
    const isOceanActive = document.body.classList.contains('ocean-mode-active');
    const onDark = isOceanActive && typeof activeSectionId !== 'undefined' && activeSectionId === 'home';
    document.querySelector('.nav')?.classList.toggle('is-on-dark', onDark);
    document.querySelector('.ocean-toggle-wrap')?.classList.toggle('is-on-dark', onDark);
}

//Picks a creature to award, favoring ones not yet unlocked
function pickOceanCreature() {
    const unlocked = getOceanUnlocked();
    const locked = OCEAN_CREATURES.filter(c => !unlocked.includes(c));
    const pool = locked.length ? locked : OCEAN_CREATURES;
    return pool[Math.floor(Math.random() * pool.length)];
}

//Formats milliseconds remaining as HH:MM:SS
function formatOceanCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

const oceanSpinBtn = document.getElementById('oceanSpinBtn');
const oceanCapsule = document.getElementById('oceanCapsule');
let oceanCountdownInterval = null;

//Keeps the spin button in sync with the cooldown state, ticking the countdown each second
function updateOceanSpinAvailability() {
    if (!oceanSpinBtn) return;

    const lastSpin = Number(localStorage.getItem(OCEAN_LAST_SPIN_KEY) || 0);
    const remaining = lastSpin + OCEAN_COOLDOWN_MS - Date.now();

    if (remaining > 0) {
        oceanSpinBtn.disabled = true;
        oceanSpinBtn.textContent = formatOceanCountdown(remaining);
        if (!oceanCountdownInterval) {
            oceanCountdownInterval = setInterval(updateOceanSpinAvailability, 1000);
        }
    } else {
        oceanSpinBtn.disabled = false;
        oceanSpinBtn.textContent = 'Spin';
        if (oceanCountdownInterval) {
            clearInterval(oceanCountdownInterval);
            oceanCountdownInterval = null;
        }
    }
}
updateOceanSpinAvailability();

//Plays the shake -> pop -> reveal capsule sequence and awards a creature
if (oceanSpinBtn && oceanCapsule) {
    oceanSpinBtn.addEventListener('click', () => {
        const lastSpin = Number(localStorage.getItem(OCEAN_LAST_SPIN_KEY) || 0);
        if (Date.now() - lastSpin < OCEAN_COOLDOWN_MS) return;

        const winner = pickOceanCreature();

        oceanSpinBtn.disabled = true;
        oceanCapsule.classList.remove('is-shaking', 'is-launching', 'is-revealed');
        void oceanCapsule.offsetWidth;
        oceanCapsule.classList.add('is-shaking');

        //Stage 1: rattle
        setTimeout(() => {
            oceanCapsule.classList.remove('is-shaking');
            oceanCapsule.classList.add('is-launching');
        }, 600);

        //Stage 2: burst open and reveal the winning creature
        setTimeout(() => {
            oceanCapsule.classList.remove('is-launching');
            oceanCapsule.classList.add('is-revealed');
            oceanCapsule.innerHTML = `<img src="Images/${winner}.png" class="ocean-capsule-creature" alt="${winner}">`;

            const unlocked = getOceanUnlocked();
            if (!unlocked.includes(winner)) {
                unlocked.push(winner);
                setOceanUnlocked(unlocked);
            }

            if (document.body.classList.contains('ocean-mode-active')) {
                renderOceanCreature(winner);
            }

            const slot = document.querySelector(`.ocean-creature-slot[data-creature="${winner}"]`);
            if (slot) {
                slot.classList.add('is-unlocked', 'is-newly-unlocked');
                setTimeout(() => slot.classList.remove('is-newly-unlocked'), 550);
            }

            localStorage.setItem(OCEAN_LAST_SPIN_KEY, String(Date.now()));
        }, 600 + 500);

        //Stage 3: settle the capsule back to its idle state, then start the cooldown countdown
        setTimeout(() => {
            oceanCapsule.classList.remove('is-revealed');
            oceanCapsule.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
            updateOceanSpinAvailability();
        }, 600 + 500 + 2000);
    });
}


//All full-page sections
const sections = [...document.querySelectorAll('.section')];

//Tracks which section is in view, so in-section keyboard shortcuts know which slider to control
let activeSectionId = sections[0]?.id || null;

//Watches sections to keep activeSectionId up to date
if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    activeSectionId = entry.target.id;
                    updateOceanChromeContrast();
                }
            });
        },
        { threshold: 0.5 }
    );
    sections.forEach(section => sectionObserver.observe(section));
}


//Eases a 0-1 progress value for the smooth-scroll animation
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


//Animates window scroll to a target element while accounting for mobile viewport changes
function smoothScrollTo(targetEl, duration = 1100) {
    const startY = window.scrollY;
    const startTime = performance.now();

    function getTargetY() {
        return targetEl.getBoundingClientRect().top + window.scrollY;
    }

    const initialTargetY = getTargetY();

    if (Math.abs(initialTargetY - startY) < 1) return;

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const targetY = getTargetY();
        const distance = targetY - startY;

        window.scrollTo(
            0,
            startY + distance * easeInOutCubic(progress)
        );

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            requestAnimationFrame(() => {
                window.scrollTo(0, getTargetY());
            });
        }
    }

    requestAnimationFrame(step);
}


//Nav links trigger an eased scroll to their target section on click
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;

        e.preventDefault();
        smoothScrollTo(targetSection, 1100);

        document.querySelector('.nav-list').classList.remove('open');
        document.querySelector('.nav').classList.remove('open');
    });
});


//Fades the scroll-hint arrow out once the user scrolls, and back in at the top
const scrollHint = document.querySelector('.scroll-hint');
if (scrollHint) {
    const SCROLL_HINT_THRESHOLD = 40;

    const updateScrollHint = () => {
        scrollHint.classList.toggle('is-hidden', window.scrollY > SCROLL_HINT_THRESHOLD);
    };

    updateScrollHint();
    window.addEventListener('scroll', updateScrollHint, { passive: true });
}


//Touch state for slider swipe detection
let touchStartX = 0;
let touchStartY = 0;
let touchDirectionLocked = null;
let isSliderTouch = false;
let touchSliderType = null; // 'about' | 'projects' | null

//Records touch start position and which slider (if any) was touched
document.addEventListener(
    'touchstart',
    e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDirectionLocked = null;
        touchSliderType = e.target.closest('.about-slider')
            ? 'about'
            : e.target.closest('.projects-carousel')
                ? 'projects'
                : null;
        isSliderTouch = !!touchSliderType;
    },
    { passive: true }
);

//Locks swipe direction and blocks page scroll only during horizontal slider drags
document.addEventListener(
    'touchmove',
    e => {
        if (!isSliderTouch) return;

        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (!touchDirectionLocked && (deltaX > 8 || deltaY > 8)) {
            touchDirectionLocked = deltaY >= deltaX ? 'vertical' : 'horizontal';
        }

        if (touchDirectionLocked === 'horizontal') {
            e.preventDefault();
        }
    },
    { passive: false }
);

//Changes the About/Projects slide on a horizontal swipe
document.addEventListener(
    'touchend',
    e => {
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        const deltaX = touchStartX - e.changedTouches[0].clientX;

        if (isSliderTouch && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (touchSliderType === 'about') {
                if (deltaX > 0 && currentPage < maxPage) {
                    goToSlide(currentPage + 1);
                } else if (deltaX < 0 && currentPage > 0) {
                    goToSlide(currentPage - 1);
                }
            } else if (touchSliderType === 'projects') {
                if (deltaX > 0 && currentProjectPage < projectMaxPage) {
                    goToProjectSlide(currentProjectPage + 1);
                } else if (deltaX < 0 && currentProjectPage > 0) {
                    goToProjectSlide(currentProjectPage - 1);
                }
            }
        }
    },
    { passive: true }
);

//About slider elements and state
const aboutSlider = document.querySelector('.about-slider');
const aboutSlides = document.querySelectorAll('.about-slide');
const dots = document.querySelectorAll('.about-pagination .page-dot');
let currentPage = 0;
const maxPage = dots.length - 1;

//Plays only the active slide's video, pausing the rest to avoid choppy playback
function syncAboutVideos() {
    aboutSlides.forEach((slide, i) => {
        const video = slide.querySelector('video');
        if (!video) return;

        if (i === currentPage) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    //Autoplay can be blocked in rare cases; failing silently is fine
                });
            }
        } else if (!video.paused) {
            video.pause();
        }
    });
}

//Moves the About slider to the given page index
function goToSlide(index) {
    currentPage = Math.max(
        0,
        Math.min(index, maxPage)
    );

    aboutSlider.style.transform = `translateX(-${currentPage * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));

    if (dots[currentPage]) {
        dots[currentPage].classList.add('active');
    }

    syncAboutVideos();
}

//Dot clicks jump to that slide
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToSlide(index);
    });
});


syncAboutVideos();

//Left/right arrow keys step through About slides when that section is in view
document.addEventListener('keydown', e => {
    if (activeSectionId !== 'about') return;

    if (e.key === 'ArrowRight' && currentPage < maxPage) {
        goToSlide(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        goToSlide(currentPage - 1);
    }
});


//Mouse drag state for the About slider
let aboutDragStartX = 0;
let isAboutDragging = false;
let aboutDragMoved = false;

//Starts a drag on the About slider
aboutSlider.addEventListener('mousedown', e => {
    if (e.target.closest('a, button')) return;
    isAboutDragging = true;
    aboutDragMoved = false;
    aboutDragStartX = e.clientX;
    aboutSlider.classList.add('is-dragging');
    document.body.classList.add('is-dragging-active');
    e.preventDefault();
});

//Follows the cursor while dragging the About slider
window.addEventListener('mousemove', e => {
    if (!isAboutDragging) return;
    const deltaX = e.clientX - aboutDragStartX;
    if (Math.abs(deltaX) > 4) aboutDragMoved = true;
    aboutSlider.style.transform = `translateX(calc(-${currentPage * 100}% + ${deltaX}px))`;
});

//Ends the drag and snaps to the nearest slide
window.addEventListener('mouseup', e => {
    if (!isAboutDragging) return;
    isAboutDragging = false;
    aboutSlider.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-active');

    const deltaX = e.clientX - aboutDragStartX;

    if (Math.abs(deltaX) > 60) {
        if (deltaX < 0 && currentPage < maxPage) {
            goToSlide(currentPage + 1);
        } else if (deltaX > 0 && currentPage > 0) {
            goToSlide(currentPage - 1);
        } else {
            goToSlide(currentPage);
        }
    } else {
        goToSlide(currentPage);
    }
});

//Blocks the click that follows a real drag, so links/buttons don't fire unintentionally
document.addEventListener(
    'click',
    e => {
        if (aboutDragMoved && e.target.closest('.about-slider')) {
            e.preventDefault();
            e.stopPropagation();
            aboutDragMoved = false;
        }
    },
    true
);


//Work item accordion elements
const workItems = [...document.querySelectorAll('.work-item')];

//Opens a work item and closes any other open one
function toggleWorkItem(item) {
    const header = item.querySelector('.work-item-header');
    const isOpen = item.classList.toggle('is-open');
    header.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
        workItems.forEach(other => {
            if (other !== item && other.classList.contains('is-open')) {
                other.classList.remove('is-open');
                other.querySelector('.work-item-header').setAttribute('aria-expanded', 'false');
            }
        });
    }
}

//Header click toggles the item; body click closes it (unless clicking a link)
workItems.forEach(item => {
    const header = item.querySelector('.work-item-header');
    header.addEventListener('click', () => toggleWorkItem(item));

    const body = item.querySelector('.work-item-body-inner');
    if (body) {
        body.addEventListener('click', e => {
            if (e.target.closest('a')) return;
            if (item.classList.contains('is-open')) {
                toggleWorkItem(item);
            }
        });
    }
});

//Fades in each work card with a staggered delay as it scrolls into view
if ('IntersectionObserver' in window && workItems.length) {
    const workRevealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const item = entry.target;
                const delay = (workItems.indexOf(item) % 2) * 90;
                setTimeout(() => item.classList.add('is-visible'), delay);
                workRevealObserver.unobserve(item);
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    workItems.forEach(item => workRevealObserver.observe(item));
} else {
    workItems.forEach(item => item.classList.add('is-visible'));
}

//Up/down arrow keys move focus between work item headers when Work is in view
document.addEventListener('keydown', e => {
    if (activeSectionId !== 'work') return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

    const headers = workItems.map(item => item.querySelector('.work-item-header'));
    const focusedIndex = headers.indexOf(document.activeElement);
    if (focusedIndex === -1) return;

    e.preventDefault();
    const nextIndex = e.key === 'ArrowDown'
        ? Math.min(focusedIndex + 1, headers.length - 1)
        : Math.max(focusedIndex - 1, 0);

    headers[nextIndex].focus();
});


//Projects carousel elements and state
const projectsTrack = document.getElementById('projectsTrack');
const projectSlides = document.querySelectorAll('.project-slide');
const projectDots = document.querySelectorAll('#projectsPagination .page-dot');
let currentProjectPage = 0;
const projectMaxPage = projectSlides.length - 1;

//Moves the Projects slider to the given page index
function goToProjectSlide(index) {
    currentProjectPage = Math.max(0, Math.min(index, projectMaxPage));

    projectsTrack.style.transform = `translateX(-${currentProjectPage * 100}%)`;
    projectDots.forEach((dot, i) => dot.classList.toggle('active', i === currentProjectPage));
}

if (projectsTrack && projectSlides.length) {
    //Dot clicks jump to that project
    projectDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToProjectSlide(index));
    });

    //Left/right arrow keys step through project slides when that section is in view
    document.addEventListener('keydown', e => {
        if (activeSectionId !== 'projects') return;

        if (e.key === 'ArrowRight' && currentProjectPage < projectMaxPage) {
            goToProjectSlide(currentProjectPage + 1);
        } else if (e.key === 'ArrowLeft' && currentProjectPage > 0) {
            goToProjectSlide(currentProjectPage - 1);
        }
    });

    //Mouse drag state for the Projects slider
    let projectsDragStartX = 0;
    let isProjectsDragging = false;
    let projectsDragMoved = false;

    //Starts a drag on the Projects slider
    projectsTrack.addEventListener('mousedown', e => {
        if (e.target.closest('a, button')) return;
        isProjectsDragging = true;
        projectsDragMoved = false;
        projectsDragStartX = e.clientX;
        projectsTrack.classList.add('is-dragging');
        document.body.classList.add('is-dragging-active');
        e.preventDefault();
    });

    //Follows the cursor while dragging the Projects slider
    window.addEventListener('mousemove', e => {
        if (!isProjectsDragging) return;
        const deltaX = e.clientX - projectsDragStartX;
        if (Math.abs(deltaX) > 4) projectsDragMoved = true;
        projectsTrack.style.transform = `translateX(calc(-${currentProjectPage * 100}% + ${deltaX}px))`;
    });

    //Ends the drag and snaps to the nearest project slide
    window.addEventListener('mouseup', e => {
        if (!isProjectsDragging) return;
        isProjectsDragging = false;
        projectsTrack.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-active');

        const deltaX = e.clientX - projectsDragStartX;

        if (Math.abs(deltaX) > 60) {
            if (deltaX < 0 && currentProjectPage < projectMaxPage) {
                goToProjectSlide(currentProjectPage + 1);
            } else if (deltaX > 0 && currentProjectPage > 0) {
                goToProjectSlide(currentProjectPage - 1);
            } else {
                goToProjectSlide(currentProjectPage);
            }
        } else {
            goToProjectSlide(currentProjectPage);
        }
    });

    //Blocks the click that follows a real drag, mirroring the About slider
    document.addEventListener(
        'click',
        e => {
            if (projectsDragMoved && e.target.closest('.projects-track')) {
                e.preventDefault();
                e.stopPropagation();
                projectsDragMoved = false;
            }
        },
        true
    );
}


//Swipe demo: on a slider's first appearance, nudges it partway to the next slide
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

//Demo transition speed and hold time for the swipe hint animation
const SWIPE_DEMO_TRANSITION_MS = 0.75 * 1000;
const SWIPE_DEMO_HOLD_MS = 100;

//Plays a short, subtle swipe demonstration for a slider
function playSwipeDemo(trackEl, getIndex, indicatorEl) {
    if (!trackEl) return;

    const startIndex = getIndex();
    const basePercent = startIndex * 100;
    const peekPercent = 10;

    trackEl.classList.add('is-swipe-demo');

    if (indicatorEl) {
        indicatorEl.classList.remove('is-visible');
        void indicatorEl.offsetHeight;
        indicatorEl.classList.add('is-visible');
    }

    requestAnimationFrame(() => {
        if (getIndex() !== startIndex) return;
        trackEl.style.transform = `translateX(-${basePercent + peekPercent}%)`;
    });

    setTimeout(() => {
        if (indicatorEl) indicatorEl.classList.remove('is-visible');

        if (getIndex() !== startIndex) {
            trackEl.classList.remove('is-swipe-demo');
            return;
        }

        trackEl.style.transform = `translateX(-${basePercent}%)`;
        setTimeout(() => trackEl.classList.remove('is-swipe-demo'), SWIPE_DEMO_TRANSITION_MS);
    }, SWIPE_DEMO_TRANSITION_MS + SWIPE_DEMO_HOLD_MS);
}

//Triggers a slider's swipe demo once half the carousel is in view
if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const swipeDemoTargets = [
        {
            visibilityTarget: aboutSlider,
            track: aboutSlider,
            getIndex: () => currentPage,
            indicator: document.querySelector('.about-card .swipe-indicator')
        },
        {
            visibilityTarget: projectsTrack,
            track: projectsTrack,
            getIndex: () => currentProjectPage,
            indicator: document.querySelector('.projects-carousel .swipe-indicator')
        }
    ];

    swipeDemoTargets.forEach(({ visibilityTarget, track, getIndex, indicator }) => {
        if (!visibilityTarget || !track) return;

        const demoObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    demoObserver.disconnect();

                    setTimeout(() => {
                        if (getIndex() !== 0) return;
                        playSwipeDemo(track, getIndex, indicator);
                    }, 450);
                });
            },
            { threshold: 0.8 }
        );

        demoObserver.observe(visibilityTarget);
    });
}


//Restores Ocean Mode on load
function applyOceanModeFromStorage() {
    let isOn = false;
    try {
        isOn = localStorage.getItem(OCEAN_MODE_KEY) === '1';
    } catch {
        isOn = false;
    }

    const oceanSwitch = document.getElementById('oceanSwitch');
    if (oceanSwitch) oceanSwitch.setAttribute('aria-checked', String(isOn));
    document.body.classList.toggle('ocean-mode-active', isOn);

    if (isOn) {
        renderAllOceanCreatures();
        refreshAllOceanCreatures();
        startOceanBubbles();
    }

    updateOceanChromeContrast();
}
setTimeout(applyOceanModeFromStorage, 0);

//Once the page (fonts, layout) fully settles, re-clamp in case the scene's true size shifted
window.addEventListener('load', () => {
    if (document.body.classList.contains('ocean-mode-active')) {
        refreshAllOceanCreatures();
    }
});