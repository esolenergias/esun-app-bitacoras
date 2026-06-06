(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        
        gsap.registerPlugin(ScrollTrigger);
        console.log('eSol Animation Engine Initialized');
        
        initGlobalTransitions();
        initAnteproyectoStory();
    });

    function initGlobalTransitions() {
        const targets = document.querySelectorAll('.reveal, .reveal-left, .section-header, .service-card, .product-card, .diff-item, .contact-item, .form-card, .step');
        
        targets.forEach(el => {
            el.classList.add('gsap-reveal');
            
            const isLeft = el.classList.contains('reveal-left');
            const delay  = parseFloat(el.style.transitionDelay) || 0;
            
            gsap.fromTo(el, 
                { 
                    opacity: 0, 
                    x: isLeft ? -30 : 0,
                    y: isLeft ? 0 : 30, 
                    scale: 0.95 
                },
                { 
                    opacity: 1, 
                    x: 0,
                    y: 0, 
                    scale: 1, 
                    duration: 1.2, 
                    delay: delay,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }

    function initAnteproyectoStory() {
        const section   = document.querySelector('#anteproyecto');
        const container = document.querySelector('.ante-story-container');
        const dataLayer = document.querySelector('.layer-data');
        if (!section || !container) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "center center",
                end: "+=120%",
                pin: true,
                scrub: 1,
                markers: false
            }
        });

        tl.to('.layer-mesh', { opacity: 0.7, duration: 1 })
          .to('.layer-panels', { opacity: 1, y: 0, duration: 1.5, ease: "back.out(1.7)" }, "-=0.2")
          .fromTo(dataLayer || '.layer-data', 
              { opacity: 0, scale: 0.8 },
              { 
                  opacity: 1, 
                  scale: 1, 
                  duration: 1,
                  onStart: () => {
                      if (dataLayer) dataLayer.removeAttribute('aria-hidden');
                  },
                  onReverseComplete: () => {
                      if (dataLayer) dataLayer.setAttribute('aria-hidden', 'true');
                  }
              }, "-=0.5");
    }
})();
