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

        document.querySelector('.nav-list').classList.remove('open');
        document.querySelector('.nav').classList.remove('open');

        const targetTop = target.offsetTop;

        document.documentElement.style.scrollSnapType = 'none';
        window.scrollTo({ top: targetTop, behavior: 'smooth' });

        const restore = () => {
            window.scrollTo({ top: targetTop, behavior: 'instant' });
            requestAnimationFrame(() => requestAnimationFrame(() => {
                document.documentElement.style.scrollSnapType = '';
            }));
        };

        if ('onscrollend' in window) {
            window.addEventListener('scrollend', restore, { once: true });
        } else {
            setTimeout(restore, 900);
        }
    });
});

/* About slider */
const aboutSlider = document.querySelector('.about-slider');
const dots        = document.querySelectorAll('.page-dot');
let currentPage   = 0;
const maxPage     = dots.length - 1;

function goToSlide(index) {
    currentPage = Math.max(0, Math.min(index, maxPage));
    aboutSlider.style.transform = `translateX(-${currentPage * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if (dots[currentPage]) dots[currentPage].classList.add('active');
    updateArrows();
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
});

/* About arrows */
function updateArrows() {
    document.querySelector('.about-arrow-left').classList.toggle('is-disabled', currentPage === 0);
    document.querySelector('.about-arrow-right').classList.toggle('is-disabled', currentPage === maxPage);
}

document.querySelector('.about-arrow-left').addEventListener('click', () => {
    if (currentPage > 0) goToSlide(currentPage - 1);
});
document.querySelector('.about-arrow-right').addEventListener('click', () => {
    if (currentPage < maxPage) goToSlide(currentPage + 1);
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