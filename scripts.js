//Nav toggle
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}


//Section navigation
const sections = [...document.querySelectorAll('.section')];
let currentSection = 0;
let isAnimating = false;
let wheelCooldown = false;

function updateCurrentSection() {
    const viewportCenter = window.scrollY + window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    sections.forEach((section, index) => {
        const sectionCenter = section.offsetTop + section.offsetHeight / 2;

        const distance = Math.abs(viewportCenter - sectionCenter);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    currentSection = closestIndex;
}


//Smoothing algorithm
function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


//Smooth Scroll
let animationFrameId = null;
let wheelLocked = false;

function smoothScrollTo(targetY, duration = 800) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    isAnimating = true;
    wheelLocked = true;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        window.scrollTo(
            0,
            startY + distance * easeInOutCubic(progress)
        );

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } 
        else {
            isAnimating = false;
            animationFrameId = null;

            setTimeout(() => {
                wheelLocked = false;
            }, 100);
        }
    }

    animationFrameId = requestAnimationFrame(animate);
}

//Locate correct section
function goToSection(index) {
    if (isAnimating) return;
    index = Math.max(0, Math.min(index, sections.length - 1));
    
    if (index === currentSection) return;
    currentSection = index;

    smoothScrollTo(sections[index].offsetTop, 900);
}


//Navbar links
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (!targetSection) return;
        e.preventDefault();
        
        const targetIndex = sections.indexOf(targetSection);
        goToSection(targetIndex);
        
        document.querySelector('.nav-list').classList.remove('open');
        document.querySelector('.nav').classList.remove('open');
    });
});


//Scroll wheel nav
window.addEventListener(
    'wheel',
    e => {
        if (window.innerWidth <= 480) return;
        if (wheelLocked) {
            e.preventDefault();
            return;
        }
        if (Math.abs(e.deltaY) < 30) return;

        const targetIndex = e.deltaY > 0 ? currentSection + 1 : currentSection - 1;
        const clampedIndex = Math.max(0, Math.min(targetIndex, sections.length - 1));

        e.preventDefault();

        if (clampedIndex === currentSection) return;

        wheelLocked = true;
        goToSection(targetIndex);
    },
    { passive: false }
);


//Touch nav
let touchStartX = 0;
let touchStartY = 0;
let touchDirectionLocked = null;
let isSliderTouch = false;
let isWorkSliderTouch = false;

document.addEventListener(
    'touchstart',
    e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDirectionLocked = null;
        isSliderTouch = !!e.target.closest('.about-slider');
        isWorkSliderTouch = !!e.target.closest('.work-viewport');
    },
    { passive: true }
);

//Passive = false. JS runs all scroll behavior
document.addEventListener(
    'touchmove',
    e => {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
        if (!touchDirectionLocked && (deltaX > 8 || deltaY > 8)) {
            touchDirectionLocked = deltaY >= deltaX ? 'vertical' : 'horizontal';
        }

        if (
            touchDirectionLocked === 'vertical' ||
            (touchDirectionLocked === 'horizontal' && (isSliderTouch || isWorkSliderTouch))
        ) {
            e.preventDefault();
        }
    },
    { passive: false }
);

//Horizontal swipe on the about slider changes slide.
//Horizontal swipe on the work slider changes page.
//Any other vertical swipe is full-page section navigation.
document.addEventListener(
    'touchend',
    e => {
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        const deltaX = touchStartX - e.changedTouches[0].clientX;

        //Horizontal swipe on the about slider to change slide
        if (isSliderTouch && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && currentPage < maxPage) {
                goToSlide(currentPage + 1);
            } 
            else if (deltaX < 0 && currentPage > 0) {
                goToSlide(currentPage - 1);
            }
            return;
        }

        //Horizontal swipe on the work slider to change page
        if (isWorkSliderTouch && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0 && currentWorkPage < workPages.length - 1) {
                goToWorkPage(currentWorkPage + 1);
            } 
            else if (deltaX < 0 && currentWorkPage > 0) {
                goToWorkPage(currentWorkPage - 1);
            }
            return;
        }

        if (isAnimating) return;
        if (Math.abs(deltaY) < 60) return;
        if (Math.abs(deltaX) > Math.abs(deltaY)) return;
        if (deltaY > 0) {
            goToSection(currentSection + 1);
        } 
        else {
            goToSection(currentSection - 1);
        }
    },
    { passive: true }
);


//Prevent resize/scroll from corrupting rotation logic
let isRotating = false;
let rotationLockedSection = null;
let rotationSettleTimeout = null;
function beginRotationLock() {
    if (!isRotating) {
        isRotating = true;
        rotationLockedSection = currentSection;
    }
    if (rotationSettleTimeout) clearTimeout(rotationSettleTimeout);

    rotationSettleTimeout = setTimeout(() => {
        if (rotationLockedSection !== null) {
            window.scrollTo({
                top: sections[rotationLockedSection].offsetTop,
                behavior: 'auto'
            });
            currentSection = rotationLockedSection;
        }
        isRotating = false;
        rotationLockedSection = null;
    }, 400);
}

window.addEventListener('orientationchange', beginRotationLock);

//Detect current section immediately
updateCurrentSection();


//Ensure section index is up to date
window.addEventListener('scroll', () => {
    if (isAnimating || isRotating) return;
    updateCurrentSection();
});


//Update view on screen resize (60fps)
let resizeFrame = null;
window.addEventListener('resize', () => {
    if (isAnimating) return;
    if (isRotating) beginRotationLock();
    if (resizeFrame) return;

    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        const targetIndex = isRotating ? rotationLockedSection : currentSection;
        const section = sections[targetIndex];
        if (!section) return;
        window.scrollTo(0, section.offsetTop);
    });
});

//About slider
const aboutSlider = document.querySelector('.about-slider');
const dots = document.querySelectorAll('.page-dot');
let currentPage = 0;
const maxPage = dots.length - 1;

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

//About arrow key navigation
document.addEventListener('keydown', e => {
    if (sections[currentSection]?.id !== 'about') return;

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
        if (workDragMoved && e.target.closest('.work-viewport')) {
            e.preventDefault();
            e.stopPropagation();
            workDragMoved = false;
        }
    },
    true
);


//Locate current section on rotation
function snapToCurrentSection() {
    const section = sections[currentSection];
    if (!section) return;

    window.scrollTo({
        top: section.offsetTop,
        behavior: 'auto'
    });

    updateCurrentSection();
}


//Work section: horizontal pagination (mirrors the About slider)
//Cards are written flat in the HTML (#workList); this groups them into pages
//of 2 cards each, builds the dot pagination to match, and drives page changes
//via dots, arrows, drag, touch swipe, and left/right arrow keys.
const workViewport = document.querySelector('.work-viewport');
const workSlider = document.getElementById('workList');
const workPaginationEl = document.getElementById('workPagination');
const allWorkItems = workSlider ? [...workSlider.querySelectorAll('.work-item')] : [];

const workItemsPerPage = 2;
let currentWorkPage = 0;
let workPages = [];
let workDots = [];
let workRevealed = false;

function buildWorkPages() {
    workSlider.innerHTML = '';
    const pages = [];

    for (let i = 0; i < allWorkItems.length; i += workItemsPerPage) {
        const page = document.createElement('div');
        page.className = 'work-page';
        allWorkItems.slice(i, i + workItemsPerPage).forEach(item => page.appendChild(item));
        workSlider.appendChild(page);
        pages.push(page);
    }

    return pages;
}

function buildWorkDots(count) {
    workPaginationEl.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('button');
        dot.className = 'work-dot';
        dot.setAttribute('aria-label', `Work page ${i + 1}`);
        dot.addEventListener('click', () => goToWorkPage(i));
        workPaginationEl.appendChild(dot);
    }

    return [...workPaginationEl.children];
}

function updateWorkDots() {
    workDots.forEach((dot, i) => dot.classList.toggle('active', i === currentWorkPage));
}

function updateWorkArrows() {
    const left = document.querySelector('.work-arrow-left');
    const right = document.querySelector('.work-arrow-right');
    if (!left || !right) return;

    left.classList.toggle('is-disabled', currentWorkPage === 0);
    right.classList.toggle('is-disabled', currentWorkPage === workPages.length - 1);
}

function applyWorkTransform(animate = true) {
    if (!animate) workSlider.style.transition = 'none';
    workSlider.style.transform = `translateX(-${currentWorkPage * 100}%)`;
    if (!animate) {
        void workSlider.offsetHeight;
        workSlider.style.transition = '';
    }
}

function revealWorkPage() {
    const page = workPages[currentWorkPage];
    if (!page) return;

    [...page.children].forEach((item, i) => {
        item.classList.remove('is-visible');
        void item.offsetWidth;
        setTimeout(() => item.classList.add('is-visible'), i * 100);
    });
}

function goToWorkPage(index) {
    index = Math.max(0, Math.min(index, workPages.length - 1));
    if (index === currentWorkPage) return;
    currentWorkPage = index;
    applyWorkTransform(true);
    updateWorkDots();
    updateWorkArrows();
    revealWorkPage();
}

function renderWorkPages() {
    workPages = buildWorkPages();
    workDots = buildWorkDots(workPages.length);
    currentWorkPage = Math.min(currentWorkPage, workPages.length - 1);
    applyWorkTransform(false);
    updateWorkDots();
    updateWorkArrows();
    revealWorkPage();
}

if (workViewport && workSlider && workPaginationEl && allWorkItems.length) {
    renderWorkPages();

    //Trigger the entrance animation the first time the Work section scrolls into view
    const workSectionEl = document.getElementById('work');
    if ('IntersectionObserver' in window && workSectionEl) {
        const workRevealObserver = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting || workRevealed) return;
                    workRevealed = true;
                    revealWorkPage();
                    workRevealObserver.disconnect();
                });
            },
            { threshold: 0.25 }
        );
        workRevealObserver.observe(workSectionEl);
    } else {
        workRevealed = true;
        revealWorkPage();
    }

    //Work arrows
    const workArrowLeft = document.querySelector('.work-arrow-left');
    const workArrowRight = document.querySelector('.work-arrow-right');

    if (workArrowLeft) {
        workArrowLeft.addEventListener('click', () => {
            if (currentWorkPage > 0) goToWorkPage(currentWorkPage - 1);
        });
    }

    if (workArrowRight) {
        workArrowRight.addEventListener('click', () => {
            if (currentWorkPage < workPages.length - 1) goToWorkPage(currentWorkPage + 1);
        });
    }

    //Left/right arrow keys page through the work list while the Work section is active
    document.addEventListener('keydown', e => {
        if (sections[currentSection]?.id !== 'work') return;

        if (e.key === 'ArrowRight' && currentWorkPage < workPages.length - 1) {
            e.preventDefault();
            goToWorkPage(currentWorkPage + 1);
        } else if (e.key === 'ArrowLeft' && currentWorkPage > 0) {
            e.preventDefault();
            goToWorkPage(currentWorkPage - 1);
        }
    });
}

//Work slider: click-and-drag (desktop mouse) horizontal paging, mirroring the about slider
let workDragStartX = 0;
let isWorkDragging = false;
let workDragMoved = false;

if (workViewport && workSlider) {
    workViewport.addEventListener('mousedown', e => {
        if (e.target.closest('a, button')) return;
        isWorkDragging = true;
        workDragMoved = false;
        workDragStartX = e.clientX;
        workSlider.style.transition = 'none';
        workViewport.classList.add('is-dragging');
        document.body.classList.add('is-dragging-active');
        e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
        if (!isWorkDragging) return;
        const deltaX = e.clientX - workDragStartX;
        if (Math.abs(deltaX) > 4) workDragMoved = true;
        workSlider.style.transform = `translateX(calc(-${currentWorkPage * 100}% + ${deltaX}px))`;
    });

    window.addEventListener('mouseup', e => {
        if (!isWorkDragging) return;
        isWorkDragging = false;
        workViewport.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-active');
        workSlider.style.transition = '';

        const deltaX = e.clientX - workDragStartX;

        if (Math.abs(deltaX) > 60) {
            if (deltaX < 0 && currentWorkPage < workPages.length - 1) {
                goToWorkPage(currentWorkPage + 1);
            } else if (deltaX > 0 && currentWorkPage > 0) {
                goToWorkPage(currentWorkPage - 1);
            } else {
                applyWorkTransform(true);
            }
        } else {
            applyWorkTransform(true);
        }
    });
}