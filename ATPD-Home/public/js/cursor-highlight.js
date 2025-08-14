/* add mousecursor highlighteffect parameters (mousePosition) */
const header = document.querySelector('header');

header.addEventListener('mousemove', (e) => {
  const rect = header.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  header.style.setProperty('--mouse-x', `${x}%`);
  header.style.setProperty('--mouse-y', `${y}%`);
});

const body = document.querySelector('body');

body.addEventListener('mousemove', (e) => {
  const rect = body.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  body.style.setProperty('--mouse-x', `${x}%`);
  body.style.setProperty('--mouse-y', `${y}%`);
});
