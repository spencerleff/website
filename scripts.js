//Nav toggle
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}


//Sections
const sections = [...document.querySelectorAll('.section')];

//Track which section is currently in view. This is used only to gate the
//in-section keyboard shortcuts below (About slide arrows / Work page arrows)
//to whichever section the user is actually looking at. It does NOT drive
//any scrolling — the browser owns scrolling entirely.
let activeSectionId = sections[0]?.id || null;

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


//Navbar links: trigger the browser's own smooth scroll to the target section.
//This is deliberate, user-initiated navigation (a click), not scroll-jacking —
//wheel/touch/keyboard scrolling is still left entirely native.
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;

        e.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        document.querySelector('.nav-list').classList.remove('open');
        document.querySelector('.nav').classList.remove('open');
    });
});


//Scroll hint (bouncing arrow on the Home section): fade it out once the user
//has scrolled a little under their own power, and bring it back if they
//return to the top.
const scrollHint = document.querySelector('.scroll-hint');
if (scrollHint) {
    const SCROLL_HINT_THRESHOLD = 40;

    const updateScrollHint = () => {
        scrollHint.classList.toggle('is-hidden', window.scrollY > SCROLL_HINT_THRESHOLD);
    };

    updateScrollHint();
    window.addEventListener('scroll', updateScrollHint, { passive: true });
}


//Touch nav
//Only horizontal swipes on the About slider or Projects carousel are
//intercepted (to page through slides/cards). Vertical touches are left
//completely alone so the browser's native scroll handles moving between
//sections.
let touchStartX = 0;
let touchStartY = 0;
let touchDirectionLocked = null;
let isSliderTouch = false;
let touchSliderType = null; // 'about' | 'projects' | null

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

document.addEventListener(
    'touchmove',
    e => {
        //Not on a slider — let native scroll handle everything, don't even
        //bother tracking direction.
        if (!isSliderTouch) return;

        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (!touchDirectionLocked && (deltaX > 8 || deltaY > 8)) {
            touchDirectionLocked = deltaY >= deltaX ? 'vertical' : 'horizontal';
        }

        //Only take over the touch when it's a horizontal swipe on the slider.
        //Vertical swipes always fall through to native page scroll.
        if (touchDirectionLocked === 'horizontal') {
            e.preventDefault();
        }
    },
    { passive: false }
);

//Horizontal swipe on the About slider or Projects carousel changes slide.
//Vertical swipes are never intercepted — native scrolling owns them.
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

//About slider
const aboutSlider = document.querySelector('.about-slider');
const aboutSlides = document.querySelectorAll('.about-slide');
const dots = document.querySelectorAll('.about-pagination .page-dot');
let currentPage = 0;
const maxPage = dots.length - 1;

//Only the active slide's video should ever be playing. With every slide
//rendered in the DOM at once, letting offscreen videos autoplay/loop in the
//background makes them compete for the device's decode pipeline, which is
//what causes choppy playback once you actually swipe to one. Pausing
//everything except the current slide fixes that.
function syncAboutVideos() {
    aboutSlides.forEach((slide, i) => {
        const video = slide.querySelector('video');
        if (!video) return;

        if (i === currentPage) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    //Autoplay can be blocked in rare cases (e.g. low-power mode);
                    //failing silently is fine since the video simply stays paused.
                });
            }
        } else if (!video.paused) {
            video.pause();
        }
    });
}

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

    updateArrows();
    syncAboutVideos();
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToSlide(index);
    });
});


//About arrows
function updateArrows() {
    const left = document.querySelector('.about-arrow-left');
    const right = document.querySelector('.about-arrow-right');
    
    left.classList.toggle('is-disabled', currentPage === 0);
    right.classList.toggle('is-disabled', currentPage === maxPage);
}

document
    .querySelector('.about-arrow-left')
    .addEventListener('click', () => {
        if (currentPage > 0) {
            goToSlide(currentPage - 1);
        }
    });

document
    .querySelector('.about-arrow-right')
    .addEventListener('click', () => {
        if (currentPage < maxPage) {
            goToSlide(currentPage + 1);
        }
    });

updateArrows();
syncAboutVideos();

//About arrow key navigation (only while the About section is in view)
document.addEventListener('keydown', e => {
    if (activeSectionId !== 'about') return;

    if (e.key === 'ArrowRight' && currentPage < maxPage) {
        goToSlide(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        goToSlide(currentPage - 1);
    }
});


//About slider: click-and-drag (desktop mouse) support, mirroring touch swipe
let aboutDragStartX = 0;
let isAboutDragging = false;
let aboutDragMoved = false;

aboutSlider.addEventListener('mousedown', e => {
    if (e.target.closest('a, button')) return;
    isAboutDragging = true;
    aboutDragMoved = false;
    aboutDragStartX = e.clientX;
    aboutSlider.classList.add('is-dragging');
    document.body.classList.add('is-dragging-active');
    e.preventDefault();
});

window.addEventListener('mousemove', e => {
    if (!isAboutDragging) return;
    const deltaX = e.clientX - aboutDragStartX;
    if (Math.abs(deltaX) > 4) aboutDragMoved = true;
    aboutSlider.style.transform = `translateX(calc(-${currentPage * 100}% + ${deltaX}px))`;
});

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

//Suppress the click that follows a real drag, so links/buttons under the
//cursor don't fire unintentionally when a drag ends on top of them
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


//Work section: vertical accordion list
const workItems = [...document.querySelectorAll('.work-item')];

function toggleWorkItem(item) {
    const header = item.querySelector('.work-item-header');
    const isOpen = item.classList.toggle('is-open');
    header.setAttribute('aria-expanded', String(isOpen));

    //Accordion behavior: closing every other open card when this one opens
    if (isOpen) {
        workItems.forEach(other => {
            if (other !== item && other.classList.contains('is-open')) {
                other.classList.remove('is-open');
                other.querySelector('.work-item-header').setAttribute('aria-expanded', 'false');
            }
        });
    }
}

workItems.forEach(item => {
    const header = item.querySelector('.work-item-header');
    header.addEventListener('click', () => toggleWorkItem(item));

    //Clicking anywhere in the expanded details area also closes the card,
    //as long as the click isn't on a real link (e.g. the press release link).
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

//Reveal each card with a staggered fade-up as it individually scrolls into
//view. Unlike the old single-trigger reveal, this works for a list that can
//grow past one screen — cards animate in as the user reaches them.
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

//Up/Down arrow keys move focus between work item headers (only while the
//Work section is in view, and only when a header already has focus)
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


//Projects carousel
//A centered "peek" slider: the active card sits in the middle of the
//viewport with slivers of its neighbors visible on either side. Position is
//calculated in pixels (rather than percentages, like the About slider) so
//that mismatched gaps/card widths always center correctly.
const projectsCarousel = document.querySelector('.projects-carousel');
const projectsTrack = document.getElementById('projectsTrack');
const projectCards = [...document.querySelectorAll('.project-card')];
const projectDots = document.querySelectorAll('#projectsPagination .page-dot');
let currentProjectPage = 1;
const projectMaxPage = projectCards.length - 1;

function getProjectCenterOffset(page) {
    const cardEl = projectCards[page];
    if (!projectsCarousel || !cardEl) return 0;
    const containerWidth = projectsCarousel.clientWidth;
    return containerWidth / 2 - cardEl.offsetLeft - cardEl.offsetWidth / 2;
}

function centerProjectsTrack(withTransition = true) {
    if (!projectsTrack) return;
    if (!withTransition) projectsTrack.style.transition = 'none';
    projectsTrack.style.transform = `translateX(${getProjectCenterOffset(currentProjectPage)}px)`;
    if (!withTransition) {
        //Force a reflow so the transition-less jump applies immediately,
        //then hand control back to the CSS transition for future moves.
        void projectsTrack.offsetHeight;
        projectsTrack.style.transition = '';
    }
}

function updateProjectArrows() {
    const left = document.querySelector('.projects-arrow-left');
    const right = document.querySelector('.projects-arrow-right');
    if (!left || !right) return;
    left.classList.toggle('is-disabled', currentProjectPage === 0);
    right.classList.toggle('is-disabled', currentProjectPage === projectMaxPage);
}

function updateProjectActiveStates() {
    projectCards.forEach((card, i) => card.classList.toggle('is-active', i === currentProjectPage));
    projectDots.forEach((dot, i) => dot.classList.toggle('active', i === currentProjectPage));
    updateProjectArrows();
}

function goToProjectSlide(index) {
    currentProjectPage = Math.max(0, Math.min(index, projectMaxPage));
    updateProjectActiveStates();
    centerProjectsTrack();
}

if (projectsTrack && projectCards.length) {
    projectDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToProjectSlide(index));
    });

    document.querySelector('.projects-arrow-left')?.addEventListener('click', () => {
        if (currentProjectPage > 0) goToProjectSlide(currentProjectPage - 1);
    });

    document.querySelector('.projects-arrow-right')?.addEventListener('click', () => {
        if (currentProjectPage < projectMaxPage) goToProjectSlide(currentProjectPage + 1);
    });

    updateProjectActiveStates();
    centerProjectsTrack(false);

    //Recenter (without animating) if the viewport or card sizing changes
    window.addEventListener('resize', () => centerProjectsTrack(false));
    window.addEventListener('load', () => centerProjectsTrack(false));

    //Left/Right arrow keys move between projects (only while the Projects
    //section is in view)
    document.addEventListener('keydown', e => {
        if (activeSectionId !== 'projects') return;

        if (e.key === 'ArrowRight' && currentProjectPage < projectMaxPage) {
            goToProjectSlide(currentProjectPage + 1);
        } else if (e.key === 'ArrowLeft' && currentProjectPage > 0) {
            goToProjectSlide(currentProjectPage - 1);
        }
    });

    //Click-and-drag (desktop mouse) support, mirroring the About slider
    let projectsDragStartX = 0;
    let projectsBaseTranslate = 0;
    let isProjectsDragging = false;
    let projectsDragMoved = false;

    projectsTrack.addEventListener('mousedown', e => {
        if (e.target.closest('a, button')) return;
        isProjectsDragging = true;
        projectsDragMoved = false;
        projectsDragStartX = e.clientX;
        projectsBaseTranslate = getProjectCenterOffset(currentProjectPage);
        projectsTrack.classList.add('is-dragging');
        document.body.classList.add('is-dragging-active');
        e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
        if (!isProjectsDragging) return;
        const deltaX = e.clientX - projectsDragStartX;
        if (Math.abs(deltaX) > 4) projectsDragMoved = true;
        projectsTrack.style.transform = `translateX(${projectsBaseTranslate + deltaX}px)`;
    });

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

    //Suppress the click that follows a real drag, mirroring the About slider
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