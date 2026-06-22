/* Nav toggle */
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav     = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}


/* Section navigation */
const sections = [...document.querySelectorAll('.section')];
let currentSection = 0;
let isAnimating = false;
let wheelCooldown = false;

function updateCurrentSection() {
    let closestIndex = 0;
    let closestDistance = Infinity;
    sections.forEach((section, index) => {
        const distance = Math.abs(
            window.scrollY - section.offsetTop
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });
    currentSection = closestIndex;
}


/* Smoothing algorithm */
function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


/* Smooth Scroll */
function smoothScrollTo(targetY, duration = 800) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();
    isAnimating = true;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo(
            0,
            startY + distance * easeInOutCubic(progress)
        );
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
        else {
            isAnimating = false;
        }
    }

    requestAnimationFrame(animate);
}

/* Locate correct section */
function goToSection(index) {
    if (isAnimating) return;
    index = Math.max(
        0,
        Math.min(index, sections.length - 1)
    );
    if (index === currentSection) return;
    currentSection = index;
    smoothScrollTo(
        sections[index].offsetTop,
        900
    );
}


/* Navbar links */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (!targetSection) return;
        e.preventDefault();
        const targetIndex = sections.indexOf(targetSection);
        goToSection(targetIndex);
        document
            .querySelector('.nav-list')
            .classList.remove('open');
        document
            .querySelector('.nav')
            .classList.remove('open');
    });
});


/* Scroll wheel nav */
window.addEventListener(
    'wheel',
    e => {
        if (window.innerWidth <= 480) return;
        if (isAnimating || wheelCooldown) return;
        if (Math.abs(e.deltaY) < 30) return;
        wheelCooldown = true;
        setTimeout(() => {
            wheelCooldown = false;
        }, 300);
        if (e.deltaY > 0) {
            goToSection(currentSection + 1);
        } else {
            goToSection(currentSection - 1);
        }
        e.preventDefault();
    },
    { passive: false }
);


/* Touch nav */
let touchStartY = 0;
let touchEndY = 0;
document.addEventListener(
    'touchstart',
    e => {
        touchStartY = e.touches[0].clientY;
    },
    { passive: true }
);
document.addEventListener(
    'touchend',
    e => {
        if (isAnimating) return;
        touchEndY = e.changedTouches[0].clientY;
        const delta = touchStartY - touchEndY;
        if (Math.abs(delta) < 60) return;
        if (delta > 0) {
            goToSection(currentSection + 1);
        }
        else {
            goToSection(currentSection - 1);
        }
    },
    { passive: true }
);

/* Ensure section index is up to date */
window.addEventListener('scroll', () => {
    if (isAnimating) return;
    updateCurrentSection();
});

/* Update on screen resize */
window.addEventListener('resize', () => {
    if (isAnimating) return;
    updateCurrentSection();
});

/* Detect current section immediately */
updateCurrentSection();


/* About slider */
const aboutSlider = document.querySelector('.about-slider');
const dots = document.querySelectorAll('.page-dot');
let currentPage = 0;
const maxPage = dots.length - 1;

function goToSlide(index) {
    currentPage = Math.max(
        0,
        Math.min(index, maxPage)
    );
    aboutSlider.style.transform =
        `translateX(-${currentPage * 100}%)`;
    dots.forEach(dot =>
        dot.classList.remove('active')
    );
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


/* About arrows */
function updateArrows() {
    const left =
        document.querySelector('.about-arrow-left');
    const right =
        document.querySelector('.about-arrow-right');
    left.classList.toggle(
        'is-disabled',
        currentPage === 0
    );
    right.classList.toggle(
        'is-disabled',
        currentPage === maxPage
    );
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