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

//Animates window scroll to a target Y position
function smoothScrollTo(targetY, duration = 1100) {
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 1) return;

    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
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
        smoothScrollTo(targetSection.offsetTop, 1100);

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

    updateArrows();
    syncAboutVideos();
}

//Dot clicks jump to that slide
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        goToSlide(index);
    });
});


//Enables/disables the About arrows at the first/last slide
function updateArrows() {
    const left = document.querySelector('.about-arrow-left');
    const right = document.querySelector('.about-arrow-right');
    
    left.classList.toggle('is-disabled', currentPage === 0);
    right.classList.toggle('is-disabled', currentPage === maxPage);
}

//Arrow buttons step through About slides
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
const projectsCarousel = document.querySelector('.projects-carousel');
const projectsTrack = document.getElementById('projectsTrack');
const projectCards = [...document.querySelectorAll('.project-card')];
const projectDots = document.querySelectorAll('#projectsPagination .page-dot');
let currentProjectPage = 1;
const projectMaxPage = projectCards.length - 1;

//Calculates the pixel offset needed to center a given project card
function getProjectCenterOffset(page) {
    const cardEl = projectCards[page];
    if (!projectsCarousel || !cardEl) return 0;
    const containerWidth = projectsCarousel.clientWidth;
    return containerWidth / 2 - cardEl.offsetLeft - cardEl.offsetWidth / 2;
}

//Centers the track on the current project page
function centerProjectsTrack(withTransition = true) {
    if (!projectsTrack) return;
    if (!withTransition) projectsTrack.style.transition = 'none';
    projectsTrack.style.transform = `translateX(${getProjectCenterOffset(currentProjectPage)}px)`;
    if (!withTransition) {
        void projectsTrack.offsetHeight;
        projectsTrack.style.transition = '';
    }
}

//Enables/disables the Projects arrows at the first/last card
function updateProjectArrows() {
    const left = document.querySelector('.projects-arrow-left');
    const right = document.querySelector('.projects-arrow-right');
    if (!left || !right) return;
    left.classList.toggle('is-disabled', currentProjectPage === 0);
    right.classList.toggle('is-disabled', currentProjectPage === projectMaxPage);
}

//Updates active card, active dot, and arrow states
function updateProjectActiveStates() {
    projectCards.forEach((card, i) => card.classList.toggle('is-active', i === currentProjectPage));
    projectDots.forEach((dot, i) => dot.classList.toggle('active', i === currentProjectPage));
    updateProjectArrows();
}

//Moves the Projects carousel to the given page index
function goToProjectSlide(index) {
    currentProjectPage = Math.max(0, Math.min(index, projectMaxPage));
    updateProjectActiveStates();
    centerProjectsTrack();
}

if (projectsTrack && projectCards.length) {
    //Dot clicks jump to that project
    projectDots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToProjectSlide(index));
    });

    //Arrow buttons step through project cards
    document.querySelector('.projects-arrow-left')?.addEventListener('click', () => {
        if (currentProjectPage > 0) goToProjectSlide(currentProjectPage - 1);
    });

    document.querySelector('.projects-arrow-right')?.addEventListener('click', () => {
        if (currentProjectPage < projectMaxPage) goToProjectSlide(currentProjectPage + 1);
    });

    updateProjectActiveStates();
    centerProjectsTrack(false);

    //Clicking a peeking (non-active) card brings it to center
    projectCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index !== currentProjectPage) {
                goToProjectSlide(index);
            }
        });
    });

    //Recenters the track without animating on resize/load
    window.addEventListener('resize', () => centerProjectsTrack(false));
    window.addEventListener('load', () => centerProjectsTrack(false));

    //Left/right arrow keys step through project cards when that section is in view
    document.addEventListener('keydown', e => {
        if (activeSectionId !== 'projects') return;

        if (e.key === 'ArrowRight' && currentProjectPage < projectMaxPage) {
            goToProjectSlide(currentProjectPage + 1);
        } else if (e.key === 'ArrowLeft' && currentProjectPage > 0) {
            goToProjectSlide(currentProjectPage - 1);
        }
    });

    //Mouse drag state for the Projects carousel
    let projectsDragStartX = 0;
    let projectsBaseTranslate = 0;
    let isProjectsDragging = false;
    let projectsDragMoved = false;

    //Starts a drag on the Projects carousel
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

    //Follows the cursor while dragging the Projects carousel
    window.addEventListener('mousemove', e => {
        if (!isProjectsDragging) return;
        const deltaX = e.clientX - projectsDragStartX;
        if (Math.abs(deltaX) > 4) projectsDragMoved = true;
        projectsTrack.style.transform = `translateX(${projectsBaseTranslate + deltaX}px)`;
    });

    //Ends the drag and snaps to the nearest project card
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


//Makes the frog sprite drift and bounce around its card, DVD-logo style
function initFrogBounce() {
    const card = document.querySelector('.project-card--frog');
    const frog = card ? card.querySelector('.frog-sprite') : null;
    if (!card || !frog) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cardW = card.clientWidth;
    let cardH = card.clientHeight;
    let frogW = frog.offsetWidth;
    let frogH = frog.offsetHeight;

    let x = Math.random() * Math.max(cardW - frogW, 0);
    let y = Math.random() * Math.max(cardH - frogH, 0);

    const speed = 64; //px per second
    const angle = Math.random() * Math.PI * 2;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;

    //Avoids a near-vertical or near-horizontal starting angle
    if (Math.abs(vx) < speed * 0.35) vx = speed * 0.35 * Math.sign(vx || 1);
    if (Math.abs(vy) < speed * 0.35) vy = speed * 0.35 * Math.sign(vy || 1);

    let lastTime = null;

    //Re-measures card/frog size and clamps position on resize
    function measure() {
        cardW = card.clientWidth;
        cardH = card.clientHeight;
        frogW = frog.offsetWidth;
        frogH = frog.offsetHeight;
        x = Math.min(x, Math.max(cardW - frogW, 0));
        y = Math.min(y, Math.max(cardH - frogH, 0));
    }
    window.addEventListener('resize', measure);

    //Advances the frog's position each frame and bounces it off the edges
    function step(time) {
        if (lastTime === null) lastTime = time;
        const dt = Math.min((time - lastTime) / 1000, 0.05); //clamp huge tab-switch gaps
        lastTime = time;

        x += vx * dt;
        y += vy * dt;

        const maxX = Math.max(cardW - frogW, 0);
        const maxY = Math.max(cardH - frogH, 0);

        if (x <= 0) {
            x = 0;
            vx = Math.abs(vx);
        } else if (x >= maxX) {
            x = maxX;
            vx = -Math.abs(vx);
        }

        if (y <= 0) {
            y = 0;
            vy = Math.abs(vy);
        } else if (y >= maxY) {
            y = maxY;
            vy = -Math.abs(vy);
        }

        frog.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

initFrogBounce();