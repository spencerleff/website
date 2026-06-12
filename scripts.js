/* Nav Toggle */
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav     = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}

/* Smooth Scroll */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

/* About Slider */
const aboutSlider = document.querySelector('.about-slider');
const dots = document.querySelectorAll('.page-dot');
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {

        aboutSlider.style.transform =
            `translateX(-${index * 100}%)`;

        dots.forEach(d =>
            d.classList.remove('active')
        );

        dot.classList.add('active');
    });
});

/* About Card Swipe Functionality */
let startX = 0;
let currentPage = 0;
const maxPage = dots.length - 1;
aboutSlider.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
});
aboutSlider.addEventListener("touchend", e => {

    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) < 50) return;

    if (diff > 0 && currentPage < maxPage) {
        currentPage++;
    }

    if (diff < 0 && currentPage > 0) {
        currentPage--;
    }

    aboutSlider.style.transform =
        `translateX(-${currentPage * 100}%)`;

    dots.forEach(dot =>
        dot.classList.remove("active")
    );

    dots[currentPage].classList.add("active");
});