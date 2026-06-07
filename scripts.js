/* ── Nav toggle ── */
function toggleNav() {
    const navList = document.querySelector('.nav-list');
    const nav     = document.querySelector('.nav');
    navList.classList.toggle('open');
    nav.classList.toggle('open');
}

/* ── Smooth scroll for all in-page links (nav + scroll arrow) ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });

        /* close nav if it's open */
        document.querySelector('.nav-list')?.classList.remove('open');
        document.querySelector('.nav')?.classList.remove('open');
    });
});