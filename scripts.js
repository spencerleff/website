/* Nav Toggle */
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav     = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}

/* Page Smooth Scroll */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

/* About dot slider */
const aboutSlider = document.querySelector('.about-slider');
const dots        = document.querySelectorAll('.page-dot');
let currentPage   = 0;
const maxPage     = dots.length - 1;

function goToSlide(index) {
    currentPage = index;
    aboutSlider.style.transform = `translateX(-${currentPage * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    dots[currentPage].classList.add('active');
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
});

/* About swipe support */
let startX = 0;

aboutSlider.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
}, { passive: true });

aboutSlider.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;

    if (diff > 0 && currentPage < maxPage) {
        goToSlide(currentPage + 1);
    } else if (diff < 0 && currentPage > 0) {
        goToSlide(currentPage - 1);
    }
});

/* About keyboard arrow navigation */
document.addEventListener('keydown', e => {
    const aboutSection = document.getElementById('about');
    const rect = aboutSection.getBoundingClientRect();
    const inView = rect.top >= -window.innerHeight / 2 && rect.bottom <= window.innerHeight * 1.5;
    if (!inView) return;

    if (e.key === 'ArrowRight' && currentPage < maxPage) {
        goToSlide(currentPage + 1);
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
        goToSlide(currentPage - 1);
    }
});