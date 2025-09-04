document.addEventListener('DOMContentLoaded', (event) => {
    const whatWeProvideSection = document.getElementById('what-we-provide');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // When the element is in view, add the class to trigger animation
                entry.target.classList.add('animate-visible');
                // Stop observing after the animation has been triggered once
                observer.unobserve(entry.target);
            }
        });
    }, {
        // The animation will trigger when the element is 10% visible
        threshold: 0.1
    });

    if (whatWeProvideSection) {
        observer.observe(whatWeProvideSection);
    }
});