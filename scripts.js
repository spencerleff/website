//Toggles the nav menu open/closed
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
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
                    updateNavContrast();
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

//Ocean collection data: id must match data-creature attrs and localStorage entries
const OCEAN_CREATURES = [
    { id: 'frog', name: 'Frog', img: 'Images/Frog.png' },
    { id: 'fish', name: 'Fish', img: 'Images/Fish.png' },
    { id: 'jellyfish', name: 'Jellyfish', img: 'Images/Jellyfish.png' },
    { id: 'otter', name: 'Otter', img: 'Images/Otter.png' },
    { id: 'shark', name: 'Shark', img: 'Images/Shark.png' },
    { id: 'starfish', name: 'Starfish', img: 'Images/Starfish.png' },
    { id: 'whale', name: 'Whale', img: 'Images/Whale.png' },
    { id: 'whaleshark', name: 'Whale Shark', img: 'Images/WhaleShark.png' }
];

//One capsule pull allowed per 24 hours
const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

//Reads the unlocked creature id list from localStorage
function getUnlockedCreatures() {
    try {
        const raw = localStorage.getItem('unlockedCreatures');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

//Persists the unlocked creature id list to localStorage
function saveUnlockedCreatures(ids) {
    localStorage.setItem('unlockedCreatures', JSON.stringify(ids));
}

//Reads whether Ocean Mode was left enabled on a previous visit
function getOceanModeSaved() {
    return localStorage.getItem('oceanModeEnabled') === 'true';
}

//Persists the Ocean Mode toggle state
function saveOceanModeState(enabled) {
    localStorage.setItem('oceanModeEnabled', enabled ? 'true' : 'false');
}

//Reads the timestamp of the last capsule pull
function getLastSpinTime() {
    return parseInt(localStorage.getItem('lastSpinTimestamp') || '0', 10);
}

//Records the timestamp of a capsule pull
function setLastSpinTime(timestamp) {
    localStorage.setItem('lastSpinTimestamp', String(timestamp));
}

//Milliseconds remaining before another pull is allowed (0 if none)
function getSpinCooldownRemaining() {
    return Math.max(0, SPIN_COOLDOWN_MS - (Date.now() - getLastSpinTime()));
}

//Formats a millisecond duration as a short "Xh Ym" style string
function formatCooldown(ms) {
    const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

//Ocean modal elements
const oceanTrigger = document.getElementById('oceanTrigger');
const oceanModalOverlay = document.getElementById('oceanModalOverlay');
const oceanModalClose = document.getElementById('oceanModalClose');
const creatureSlots = document.querySelectorAll('.creature-slot');
const capsuleEl = document.getElementById('capsule');
const capsulePullBtn = document.getElementById('capsulePullBtn');
const capsuleMessage = document.getElementById('capsuleMessage');
const capsuleRevealImg = document.getElementById('capsuleRevealImg');
const oceanModeToggle = document.getElementById('oceanModeToggle');
const oceanToggleHint = document.getElementById('oceanToggleHint');
const oceanSwimLayer = document.getElementById('oceanSwimLayer');
const homeEasterFrog = document.getElementById('homeEasterFrog');
const homeEasterWitch = document.getElementById('homeEasterWitch');

let isCapsulePulling = false;
let cooldownIntervalId = null;

//Opens the ocean modal, locks page scroll, and refreshes cooldown/lock state
function openOceanModal() {
    if (!oceanModalOverlay) return;
    oceanModalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCapsuleAvailability();

    if (!cooldownIntervalId) {
        cooldownIntervalId = setInterval(updateCapsuleAvailability, 30000);
    }
}

//Closes the ocean modal and restores page scroll
function closeOceanModal() {
    if (!oceanModalOverlay) return;
    oceanModalOverlay.classList.remove('open');
    document.body.style.overflow = '';

    if (cooldownIntervalId) {
        clearInterval(cooldownIntervalId);
        cooldownIntervalId = null;
    }
}

if (oceanTrigger) {
    oceanTrigger.addEventListener('click', openOceanModal);
}

if (oceanModalClose) {
    oceanModalClose.addEventListener('click', closeOceanModal);
}

//Clicking the dimmed backdrop (not the modal itself) closes it
if (oceanModalOverlay) {
    oceanModalOverlay.addEventListener('click', e => {
        if (e.target === oceanModalOverlay) closeOceanModal();
    });
}

//Esc closes the ocean modal when it's open
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && oceanModalOverlay && oceanModalOverlay.classList.contains('open')) {
        closeOceanModal();
    }
});

//Updates the collection grid to reflect which creatures are unlocked
function updateCreatureGrid(unlockedIds) {
    creatureSlots.forEach(slot => {
        slot.classList.toggle('unlocked', unlockedIds.includes(slot.dataset.creature));
    });
}

//Enables/disables the Ocean Mode toggle based on whether anything has been unlocked
function updateOceanToggleAvailability(unlockedIds) {
    if (!oceanModeToggle) return;
    const hasAny = unlockedIds.length > 0;
    oceanModeToggle.disabled = !hasAny;

    if (oceanToggleHint) {
        oceanToggleHint.textContent = hasAny
            ? 'Unlocked creatures will swim slowly around the landing page.'
            : 'Unlock at least one creature to enable Ocean Mode.';
    }
}

//Shows/hides the Frog Hero cast easter egg once the full collection is unlocked
function updateEasterEgg(unlockedIds) {
    const complete = unlockedIds.length >= OCEAN_CREATURES.length;
    if (homeEasterFrog) homeEasterFrog.classList.toggle('is-visible', complete);
    if (homeEasterWitch) homeEasterWitch.classList.toggle('is-visible', complete);
}

//Keeps the nav icons legible when resting on the dark landing page during Ocean Mode
function updateNavContrast() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const oceanActive = document.body.classList.contains('ocean-mode');
    nav.classList.toggle('nav--on-dark', activeSectionId === 'home' && oceanActive);
}

//Removes all creatures currently swimming in the background layer
function clearOceanSwimLayer() {
    if (oceanSwimLayer) oceanSwimLayer.innerHTML = '';
}

//Populates the swim layer with one drifting image per unlocked creature
function spawnOceanSwimLayer(unlockedIds) {
    if (!oceanSwimLayer) return;
    clearOceanSwimLayer();

    unlockedIds.forEach(id => {
        const creature = OCEAN_CREATURES.find(c => c.id === id);
        if (!creature) return;

        const img = document.createElement('img');
        img.src = creature.img;
        img.alt = '';
        img.draggable = false;
        img.className = 'ocean-swim-creature';

        const duration = 12 + Math.random() * 10;
        const delay = -Math.random() * duration;

        img.style.top = `${5 + Math.random() * 75}%`;
        img.style.left = `${5 + Math.random() * 80}%`;
        img.style.animationDuration = `${duration}s`;
        img.style.animationDelay = `${delay}s`;
        img.style.setProperty('--dx1', `${(Math.random() * 2 - 1) * 150}px`);
        img.style.setProperty('--dy1', `${(Math.random() * 2 - 1) * 80}px`);
        img.style.setProperty('--dx2', `${(Math.random() * 2 - 1) * 180}px`);
        img.style.setProperty('--dy2', `${(Math.random() * 2 - 1) * 100}px`);
        img.style.setProperty('--dx3', `${(Math.random() * 2 - 1) * 150}px`);
        img.style.setProperty('--dy3', `${(Math.random() * 2 - 1) * 80}px`);
        img.style.setProperty('--dr1', `${(Math.random() * 2 - 1) * 10}deg`);
        img.style.setProperty('--dr2', `${(Math.random() * 2 - 1) * 10}deg`);

        oceanSwimLayer.appendChild(img);
    });
}

//Turns Ocean Mode on/off: underwater landing-page theme plus the swimming layer
function applyOceanMode(enabled) {
    document.body.classList.toggle('ocean-mode', enabled);
    updateNavContrast();

    if (enabled) {
        spawnOceanSwimLayer(getUnlockedCreatures());
    } else {
        clearOceanSwimLayer();
    }
}

if (oceanModeToggle) {
    oceanModeToggle.addEventListener('change', () => {
        saveOceanModeState(oceanModeToggle.checked);
        applyOceanMode(oceanModeToggle.checked);
    });
}

//Refreshes the pull button/label based on the once-per-day cooldown
function updateCapsuleAvailability() {
    if (!capsulePullBtn || isCapsulePulling) return;

    const remaining = getSpinCooldownRemaining();
    if (remaining > 0) {
        capsulePullBtn.disabled = true;
        capsulePullBtn.textContent = `Next pull in ${formatCooldown(remaining)}`;
    } else {
        capsulePullBtn.disabled = false;
        capsulePullBtn.textContent = 'Pull Lever';
    }
}

//Runs the capsule drop/crack animation and unlocks a new (or, once complete, a repeat) creature
function pullCapsule() {
    if (isCapsulePulling || !capsuleEl || getSpinCooldownRemaining() > 0) return;

    const unlocked = getUnlockedCreatures();
    const remaining = OCEAN_CREATURES.filter(c => !unlocked.includes(c.id));
    const isDuplicatePull = remaining.length === 0;
    const pool = isDuplicatePull ? OCEAN_CREATURES : remaining;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    isCapsulePulling = true;
    capsulePullBtn.disabled = true;
    capsuleMessage.textContent = '';
    capsuleEl.classList.remove('is-cracking');
    void capsuleEl.offsetWidth;
    capsuleEl.classList.add('is-dropping');

    setTimeout(() => {
        capsuleEl.classList.remove('is-dropping');
        capsuleRevealImg.src = chosen.img;
        capsuleRevealImg.alt = chosen.name;
        capsuleEl.classList.add('is-cracking');

        setLastSpinTime(Date.now());

        if (isDuplicatePull) {
            capsuleMessage.textContent = `Full collection! Here's the ${chosen.name} again.`;
        } else {
            const updatedUnlocked = [...unlocked, chosen.id];
            saveUnlockedCreatures(updatedUnlocked);
            updateCreatureGrid(updatedUnlocked);
            updateOceanToggleAvailability(updatedUnlocked);
            updateEasterEgg(updatedUnlocked);

            if (document.body.classList.contains('ocean-mode')) {
                spawnOceanSwimLayer(updatedUnlocked);
            }

            capsuleMessage.textContent = `You unlocked the ${chosen.name}!`;
        }

        isCapsulePulling = false;
        updateCapsuleAvailability();
    }, 750);
}

if (capsulePullBtn) {
    capsulePullBtn.addEventListener('click', pullCapsule);
}

//Restores collection progress, Ocean Mode, and cooldown state on page load
(function initOceanFeature() {
    const unlocked = getUnlockedCreatures();
    updateCreatureGrid(unlocked);
    updateOceanToggleAvailability(unlocked);
    updateEasterEgg(unlocked);
    updateCapsuleAvailability();

    const oceanModeSaved = getOceanModeSaved() && unlocked.length > 0;
    if (oceanModeToggle) oceanModeToggle.checked = oceanModeSaved;
    applyOceanMode(oceanModeSaved);
})();