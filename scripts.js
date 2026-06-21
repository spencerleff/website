/* Nav toggle */
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav     = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}

/* Section smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

/* Scroll hint off */
const hint = document.querySelector('.scroll-hint');

window.addEventListener('scroll', () => {
  hint.classList.add('scroll-hint--off');
}, { once: true });

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
    updateArrows();
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
});

/* About arrow slider */
function updateArrows() {
    const left = document.querySelector('.about-arrow-left');
    const right = document.querySelector('.about-arrow-right');
    left.classList.toggle('is-disabled', currentPage === 0);
    right.classList.toggle('is-disabled', currentPage === maxPage);
}

document.querySelector('.about-arrow-left').addEventListener('click', () => {
    if (currentPage > 0) goToSlide(currentPage - 1);
});

document.querySelector('.about-arrow-right').addEventListener('click', () => {
    if (currentPage < maxPage) goToSlide(currentPage + 1);
});