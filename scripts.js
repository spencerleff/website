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

document.addEventListener(
    'touchstart',
    e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDirectionLocked = null;
        isSliderTouch = !!e.target.closest('.about-slider');
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

        if (touchDirectionLocked === 'vertical' || (touchDirectionLocked === 'horizontal' && isSliderTouch)) {
            e.preventDefault();
        }
    },
    { passive: false }
);

//Horizontal swipe on the about slider changes slide. Vertical swipe is still section navigation
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