let currentSlide = 0;
const slider = document.getElementById('recipeSlider');
const slides = slider.children;
let autoSlideInterval;
let manualOverride = false;
let overrideTimeout;

function updateSlider() {
  slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateSlider();
  pauseAutoSlide();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateSlider();
  pauseAutoSlide();
}

function autoSlide() {
  if (!manualOverride) {
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
  }
}

function pauseAutoSlide() {
  manualOverride = true;
  clearTimeout(overrideTimeout);
  overrideTimeout = setTimeout(() => {
    manualOverride = false;
  }, 60000); // 60 Sekunden pausieren
}

// Event-Listener
document.getElementById("nextButton").addEventListener("click", nextSlide);
document.getElementById("prevButton").addEventListener("click", prevSlide);
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
});

// Start
updateSlider();
autoSlideInterval = setInterval(autoSlide, 6000); // 6 Sekunden

// Theme toggle
const toggleBtn = document.getElementById("theme-toggle");
const mainStyle = document.getElementById("main-stylesheet");
const themeStyle = document.getElementById("theme-stylesheet");

toggleBtn.addEventListener("click", () => {
  const darkMode = themeStyle.disabled === false;
  themeStyle.disabled = darkMode;
  mainStyle.disabled = !darkMode;
});
