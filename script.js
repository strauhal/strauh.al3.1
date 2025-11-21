document.addEventListener('DOMContentLoaded', () => {

    /**
     * CONFIGURATION
     */
    const CONFIG = {
        DESKTOP_HOVER_DELAY: 40, // ms: Prevents mass downloads on rapid mouse movement
        MOBILE_SCROLL_DELAY: 150, // ms: Debounce for loading high-res images after scroll stops
        CACHE_SIZE: 50,
        DEFAULT_ANCHOR_Y: 10
    };

    /**
     * FEATURE 1: YOUTUBE EMBEDS
     * Replaces plain text YouTube URLs with toggleable iframes.
     * Lazy loads iframe only upon user interaction.
     */
    function initYouTubeEmbeds() {
        const paragraphs = document.querySelectorAll('p');
        const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))(?:&t=(\d+)s)?/;

        paragraphs.forEach(p => {
            const match = youtubeRegex.exec(p.innerHTML);
            if (!match) return;

            const [fullUrl, _, videoId, startTime] = match;
            const startParam = startTime ? `&start=${startTime}` : '';

            // Create Toggle Link
            const embedLink = document.createElement('a');
            Object.assign(embedLink.style, {
                cursor: 'pointer', marginLeft: '5px', textDecoration: 'underline'
            });
            embedLink.textContent = '[display]';

            const spacer = document.createElement('br');
            let iframe = null;

            embedLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (!iframe) {
                    // Lazy load: Create iframe only when clicked
                    iframe = document.createElement('iframe');
                    Object.assign(iframe, {
                        width: '560', height: '315', frameBorder: '0',
                        src: `https://www.youtube.com/embed/${videoId}?autoplay=1${startParam}`,
                        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                        allowFullscreen: true
                    });
                    iframe.style.marginLeft = '0';
                    p.appendChild(spacer);
                    p.appendChild(iframe);
                } else {
                    iframe.remove();
                    spacer.remove();
                    iframe = null;
                }
            });

            // Auto-linkify text URL if strictly text
            if (!p.querySelector(`a[href="${fullUrl}"]`)) {
                p.innerHTML = p.innerHTML.replace(fullUrl, `<a href="${fullUrl}" target="_blank">${fullUrl}</a>`);
            }
            p.appendChild(embedLink);
        });
    }

    /**
     * FEATURE 2: IMAGE PREVIEW
     * Handles Desktop Hover and Mobile Scroll/Tap interactions.
     * Implements lazy loading, debouncing, and cache management.
     */
    function initImagePreview() {
        const isMobile = () => window.matchMedia("(max-width: 900px)").matches;
        
        // --- DOM Setup ---
        const container = document.createElement('div');
        container.id = 'image-preview-container';
        Object.assign(container.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            zIndex: '-1', pointerEvents: 'none', display: 'none',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            // Safari Fixes: Force hardware acceleration to prevent "jitter" or "scroll" 
            transform: 'translate3d(0, 0, 0)',
            webkitTransform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden',
            webkitBackfaceVisibility: 'hidden'
        });

        const img = document.createElement('img');
        Object.assign(img.style, { maxWidth: '100%', maxHeight: '100%' });
        
        container.appendChild(img);
        document.body.appendChild(container);

        // --- State Management ---
        const state = {
            stickyLink: null,      // Currently highlighted link (Mobile)
            anchorY: CONFIG.DEFAULT_ANCHOR_Y, // Vertical focal point
            lastTapped: null,      // For double-tap logic
            allowClick: false,     // Flag to allow navigation
            hoverTimer: null,      // Desktop hover debounce
            loadTimer: null,       // Mobile scroll load debounce
            scrollTicking: false   // scroll performance lock
        };

        // --- Image Cache ---
        const imageCache = new Map();
        const getCachedImage = (src) => {
            if (imageCache.has(src)) {
                // Refresh LRU position
                const val = imageCache.get(src);
                imageCache.delete(src);
                imageCache.set(src, val);
                return val;
            }
            const newImg = new Image();
            newImg.src = src;
            if (imageCache.size >= CONFIG.CACHE_SIZE) {
                imageCache.delete(imageCache.keys().next().value);
            }
            imageCache.set(src, newImg);
            return newImg;
        };

        // --- Core Functions ---
        const selectors = [
            'a[href$=".jpg"]', 'a[href$=".jpeg"]', 'a[href$=".png"]', 'a[href$=".gif"]',
            'a[href$=".JPG"]', 'a[href$=".JPEG"]', 'a[href$=".PNG"]', 'a[href$=".GIF"]',
            'a[href$=".webp"]', 'a[href$=".WEBP"]'
        ].join(', ');
        
        const imageLinks = document.querySelectorAll(selectors);

        const clearHighlights = () => {
            imageLinks.forEach(l => l.classList.remove('mobile-hover'));
        };

        const showPreview = (src) => {
            // Trigger cache load only when actually needed (Lazy)
            const cached = getCachedImage(src);
            
            // Reset container for visibility
            container.style.display = 'flex';
            container.style.zIndex = '-1';
            img.style.display = 'none';

            // Apply styles based on viewport
            if (isMobile()) {
                Object.assign(img.style, {
                    width: 'auto', height: 'auto',
                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'
                });
            } else {
                Object.assign(img.style, {
                    width: 'auto', height: 'auto',
                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'
                });
            }

            const render = () => {
                // Ensure we are still trying to show the same image
                // (Edge case check if rapid switch happened)
                img.src = cached.src;
                img.style.display = 'block';
            };

            if (cached.complete) render();
            else cached.onload = render;
        };

        const hidePreview = () => {
            container.style.display = 'none';
            // Optimization: Clear src to cancel pending downloads/rendering
            img.src = ''; 
            clearHighlights();
        };

        // --- Mobile Logic ---
        
        const ensureMobileInit = () => {
            // If entering mobile mode without a selection, default to first link
            if (!state.stickyLink && imageLinks.length > 0) {
                state.anchorY = CONFIG.DEFAULT_ANCHOR_Y;
                state.stickyLink = imageLinks[0];
                state.stickyLink.classList.add('mobile-hover');
                showPreview(state.stickyLink.href);
            }
        };

        const handleScrollUpdate = () => {
            let closest = null;
            let minDiff = Infinity;

            // Efficiently find link closest to anchorY
            for (let i = 0; i < imageLinks.length; i++) {
                const link = imageLinks[i];
                const rect = link.getBoundingClientRect();
                
                // Optimization: Skip off-screen links
                if (rect.bottom < 0 || rect.top > window.innerHeight) continue;

                const diff = Math.abs(rect.top - state.anchorY);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = link;
                }
            }

            if (closest && closest !== state.stickyLink) {
                clearHighlights();
                state.stickyLink = closest;
                state.stickyLink.classList.add('mobile-hover');
                
                // Debounce image load to keep scrolling smooth
                clearTimeout(state.loadTimer);
                state.loadTimer = setTimeout(() => {
                    if (state.stickyLink) showPreview(state.stickyLink.href);
                }, CONFIG.MOBILE_SCROLL_DELAY);
            }
            state.scrollTicking = false;
        };

        // --- Event Listeners ---

        // 1. Scroll (Optimized with requestAnimationFrame)
        window.addEventListener('scroll', () => {
            if (!isMobile()) return;
            if (!state.stickyLink) ensureMobileInit();

            if (!state.scrollTicking) {
                window.requestAnimationFrame(handleScrollUpdate);
                state.scrollTicking = true;
            }
        }, { passive: true });

        // 2. Touch Interaction
        document.body.addEventListener('touchstart', (e) => {
            if (!isMobile()) return;
            if (!state.stickyLink) ensureMobileInit();

            const link = e.target.closest(selectors);

            if (link) {
                // Update Anchor to user's touch position
                state.anchorY = e.touches[0].clientY;

                // Double Tap Logic
                if (link === state.lastTapped) {
                    state.allowClick = true;
                } else {
                    // New Link Selected
                    state.allowClick = false;
                    state.lastTapped = link;
                    
                    clearHighlights();
                    state.stickyLink = link;
                    state.stickyLink.classList.add('mobile-hover');
                    
                    // Instant load on explicit tap
                    clearTimeout(state.loadTimer);
                    showPreview(state.stickyLink.href);
                }
            } else {
                // Tapped blank space: Don't move anchor, just update scroll logic
                handleScrollUpdate();
            }
        }, { passive: true });

        // 3. Resize Handler
        window.addEventListener('resize', () => {
            if (isMobile()) ensureMobileInit();
            else if (state.stickyLink) {
                // Reset mobile state when switching to desktop
                clearHighlights();
                state.stickyLink = null;
                container.style.display = 'none';
                img.src = ''; // Clear image
            }
        });

        // 4. Link Handlers
        imageLinks.forEach(link => {
            const src = link.href;

            // Click Handler
            link.addEventListener('click', (e) => {
                // Desktop: Always allow default navigation (open image)
                if (!isMobile()) return;

                // Mobile: Only allow if Double Tap flag is active
                if (state.allowClick) {
                    state.allowClick = false; // Reset
                    return; 
                }
                e.preventDefault(); // Block navigation on first tap
            });

            // Desktop Hover
            link.addEventListener('mouseenter', () => {
                if (isMobile()) return;

                clearTimeout(state.hoverTimer);
                
                // Add slight delay to prevent mass downloads
                state.hoverTimer = setTimeout(() => {
                    clearHighlights();
                    link.classList.add('mobile-hover');
                    showPreview(src);
                }, CONFIG.DESKTOP_HOVER_DELAY); 
            });

            link.addEventListener('mouseleave', () => {
                if (isMobile()) return;
                clearTimeout(state.hoverTimer);
                hidePreview();
            });
        });

        // Initial Check
        if (isMobile()) ensureMobileInit();
    }

    // Run
    initYouTubeEmbeds();
    initImagePreview();
});