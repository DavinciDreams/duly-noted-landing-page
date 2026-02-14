// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navigation
let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow when scrolled
    if (currentScroll > 50) {
        nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, integration cards, and steps
document.querySelectorAll('.feature-card, .integration-card, .step, .use-case').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Update integration badges based on availability
document.addEventListener('DOMContentLoaded', () => {
    const badges = document.querySelectorAll('.integration-badge');
    badges.forEach(badge => {
        if (badge.textContent === 'Available Now') {
            badge.style.background = '#dcfce7';
            badge.style.color = '#16a34a';
        }
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Press '?' to show keyboard shortcuts (future feature)
    if (e.key === '?' && e.shiftKey) {
        console.log('Keyboard shortcuts help (coming soon)');
    }
});
