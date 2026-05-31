function toggleNav() {
  const navList = document.querySelector('.nav-list');
  const nav = document.querySelector('.nav');

  navList.classList.toggle('open');
  nav.classList.toggle('open');
}

// Carousel
function goTo(index, manual = false) {
    const cards = document.querySelectorAll('.card');
    const dots = document.querySelectorAll('.dot');
    const carousel = document.getElementById('carousel');

    if (!carousel) return;

    current = index;
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    const card = cards[0];
    const cardWidth = card.offsetWidth;
    const gap = 16;
    const wrapWidth = carousel.parentElement.offsetWidth;
    const offset = (index * (cardWidth + gap)) - (wrapWidth / 2) + (cardWidth / 2);
    carousel.style.transform = `translateX(${-offset}px)`;
}

document.addEventListener('DOMContentLoaded', function() {
    goTo(2);
});

// Smooth scroll for nav links
document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});