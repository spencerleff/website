function toggleNav() {
  const navList = document.querySelector('.nav-list');
  const nav = document.querySelector('.nav');

  navList.classList.toggle('open');
  nav.classList.toggle('open');
}