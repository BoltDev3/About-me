document.addEventListener('DOMContentLoaded', () => {
    initScrollProgress();
    initScrollAnimations();
    initParallax();
});

/* --- 1. SCROLL PROGRESS BAR --- */
function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });
}

/* --- 2. ADVANCED SCROLL REVEAL --- */
function initScrollAnimations() {
    // A. Setup Stagger Grids
    const staggerGrids = document.querySelectorAll('.stagger-grid');
    staggerGrids.forEach(grid => {
        const children = grid.children;
        for (let i = 0; i < children.length; i++) {
            // Add base class
            children[i].classList.add('scroll-hidden');
            // Add custom delay variable
            children[i].style.setProperty('--delay', `${i * 100}ms`);
        }
    });

    // B. Observer Options
    const observerOptions = {
        threshold: 0.15, // Trigger when 15% visible
        rootMargin: "0px 0px -50px 0px" // Offset slightly so it triggers before bottom
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-in');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // C. Observe Elements
    // Select manually marked elements AND auto-marked grid items
    const elementsToAnimate = document.querySelectorAll('.scroll-hidden');
    elementsToAnimate.forEach(el => observer.observe(el));
}

/* --- 3. PARALLAX EFFECT --- */
function initParallax() {
    const parallaxItems = document.querySelectorAll('.parallax');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        parallaxItems.forEach(item => {
            const speed = item.getAttribute('data-speed') || 0.5;
            item.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}
