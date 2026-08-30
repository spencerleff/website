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

//Animates window scroll to a target element, recalculating each frame to handle mobile browser chrome shifts
function smoothScrollTo(targetEl, duration = 1100) {
    const startY = window.scrollY;
    const startTime = performance.now();

    function getTargetY() {
        return targetEl.getBoundingClientRect().top + window.scrollY;
    }

    if (Math.abs(getTargetY() - startY) < 1) return;

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const distance = getTargetY() - startY;
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            //Snaps once more in case the address bar was still settling
            requestAnimationFrame(() => window.scrollTo(0, getTargetY()));
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

//Demo transition speed and hold time, scaled from the base slide speed
const SWIPE_DEMO_TRANSITION_MS = 0.52 * 1.15 * 0.95 * 1000;
const SWIPE_DEMO_HOLD_MS = 700 * 1.15 * 0.95;

function playSwipeDemo(trackEl, getIndex, indicatorEl) {
    if (!trackEl) return;

    const startIndex = getIndex();
    const basePercent = startIndex * 100;
    const peekPercent = 40;

    trackEl.classList.add('is-swipe-demo');
    trackEl.style.transform = `translateX(-${basePercent + peekPercent}%)`;

    if (indicatorEl) {
        indicatorEl.classList.remove('is-visible');
        void indicatorEl.offsetHeight;
        indicatorEl.classList.add('is-visible');
    }

    setTimeout(() => {
        if (indicatorEl) indicatorEl.classList.remove('is-visible');

        //Leaves the transform alone if the user has already navigated during the demo
        if (getIndex() !== startIndex) {
            trackEl.classList.remove('is-swipe-demo');
            return;
        }

        trackEl.style.transform = `translateX(-${basePercent}%)`;
        setTimeout(() => trackEl.classList.remove('is-swipe-demo'), SWIPE_DEMO_TRANSITION_MS);
    }, SWIPE_DEMO_HOLD_MS);
}

//Triggers a slider's swipe demo once half the carousel is in view
if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const swipeDemoTargets = [
        { visibilityTarget: aboutSlider, track: aboutSlider, getIndex: () => currentPage, indicator: document.querySelector('.about-card .swipe-indicator') },
        { visibilityTarget: projectsTrack, track: projectsTrack, getIndex: () => currentProjectPage, indicator: document.querySelector('.projects-carousel .swipe-indicator') }
    ];

    swipeDemoTargets.forEach(({ visibilityTarget, track, getIndex, indicator }) => {
        if (!visibilityTarget || !track) return;

        const demoObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    demoObserver.disconnect();
                    setTimeout(() => {
                        if (getIndex() !== 0) return; //user already navigated away from the first slide
                        playSwipeDemo(track, getIndex, indicator);
                    }, 450);
                });
            },
            { threshold: 0.8 }
        );
        demoObserver.observe(visibilityTarget);
    });
}