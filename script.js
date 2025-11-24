document.addEventListener('DOMContentLoaded', () => {

    const CONFIG = {
        DESKTOP_HOVER_DELAY: 40,
        MOBILE_SCROLL_DELAY: 150,
        CACHE_SIZE: 50,
        DEFAULT_ANCHOR_Y: 10,
        // Extensions to target
        IMG_EXTS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    };

    // Central State
    const state = {
        isMobile: () => window.matchMedia("(max-width: 900px)").matches,
        needsLayoutUpdate: true,
        linkPositions: [], // Cache for scroll math O(1) access
        stickyLink: null,
        anchorY: CONFIG.DEFAULT_ANCHOR_Y,
        lastTapped: null,
        allowClick: false,
        timers: { hover: null, load: null },
        scrollTicking: false
    };

    // Efficient Selector String construction
    const LINK_SELECTOR = CONFIG.IMG_EXTS
        .flatMap(ext => [ext, ext.toUpperCase()])
        .map(ext => `a[href$="${ext}"]`)
        .join(', ');

    /**
     * MODULE: YouTube Embeds
     * Adds toggle functionality to YouTube links.
     * Triggers layout recalculation when toggled.
     */
    function initYouTubeEmbeds() {
        const paragraphs = document.querySelectorAll('p');
        const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))(?:&t=(\d+)s)?/;

        paragraphs.forEach(p => {
            const match = youtubeRegex.exec(p.innerHTML);
            if (!match) return;

            const [fullUrl, _, videoId, startTime] = match;

            // 1. Linkify text FIRST to avoid destroying elements we append later
            if (!p.querySelector(`a[href="${fullUrl}"]`)) {
                p.innerHTML = p.innerHTML.replace(fullUrl, `<a href="${fullUrl}" target="_blank">${fullUrl}</a>`);
            }
            
            // 2. Create Toggle Link
            const embedLink = document.createElement('a');
            Object.assign(embedLink.style, {
                cursor: 'pointer', marginLeft: '5px', textDecoration: 'underline'
            });
            embedLink.textContent = '[display]';

            // 3. Container for iframe
            const container = document.createElement('div');
            
            // 4. Append elements to the DOM
            p.appendChild(embedLink);
            p.appendChild(container);

            let isOpen = false;

            embedLink.addEventListener('click', (e) => {
                e.preventDefault();
                isOpen = !isOpen;

                if (isOpen) {
                    container.innerHTML = `
                        <br>
                        <iframe width="560" height="315" frameborder="0" 
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1${startTime ? `&start=${startTime}` : ''}" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen style="margin-left:0">
                        </iframe>`;
                } else {
                    container.innerHTML = '';
                }
                
                // Content changed height, invalidate scroll cache
                state.needsLayoutUpdate = true;
            });
        });
    }

    /**
     * MODULE: Image Preview
     * Highly optimized implementation using Delegation and Layout Caching.
     */
    function initImagePreview() {
        // --- 1. DOM Construction ---
        const container = document.createElement('div');
        container.id = 'image-preview-container';
        
        // Hardware acceleration styles for smooth rendering
        Object.assign(container.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            zIndex: '-1', pointerEvents: 'none', display: 'none',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transform: 'translate3d(0, 0, 0)',
            webkitTransform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
        });

        const img = document.createElement('img');
        Object.assign(img.style, { maxWidth: '100%', maxHeight: '100%' });
        
        container.appendChild(img);
        document.body.appendChild(container);

        // --- 2. Cache System ---
        const imageCache = new Map();
        const getCachedImage = (src) => {
            if (imageCache.has(src)) {
                const val = imageCache.get(src);
                imageCache.delete(src); // Refresh LRU
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

        // --- 3. Layout Caching (Performance Core) ---
        const imageLinks = document.querySelectorAll(LINK_SELECTOR);

        const recalculateLayout = () => {
            // Batch read DOM properties to avoid thrashing
            const scrollY = window.scrollY;
            state.linkPositions = Array.from(imageLinks).map(link => ({
                link,
                top: link.getBoundingClientRect().top + scrollY
            }));
            state.needsLayoutUpdate = false;
        };

        // --- 4. Interaction Logic ---
        
        const clearHighlights = () => {
            // Only query the DOM for active classes to minimize work
            const active = document.querySelectorAll('.mobile-hover');
            for (let i = 0; i < active.length; i++) active[i].classList.remove('mobile-hover');
        };

        const updatePreview = (src) => {
            const cached = getCachedImage(src);
            
            container.style.display = 'flex';
            container.style.zIndex = '-1';
            img.style.display = 'none'; // Hide until loaded/retrieved

            // Optimized Style Application
            const isMob = state.isMobile();
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';

            const render = () => {
                if (img.src !== cached.src) img.src = cached.src;
                img.style.display = 'block';
            };

            if (cached.complete) render();
            else cached.onload = render;
        };

        const hidePreview = () => {
            container.style.display = 'none';
            img.src = ''; // Cancel network request/render
            clearHighlights();
        };

        // Mobile: Calculate closest link using Cached Positions (Pure Math, No DOM reads)
        const updateStickyHighlight = (force = false) => {
            if (state.needsLayoutUpdate) recalculateLayout();

            const targetY = window.scrollY + state.anchorY;
            let closest = null;
            let minDiff = Infinity;

            // Fast array scan
            const len = state.linkPositions.length;
            for (let i = 0; i < len; i++) {
                const item = state.linkPositions[i];
                const diff = Math.abs(item.top - targetY);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = item.link;
                }
            }

            if (closest && (closest !== state.stickyLink || force)) {
                clearHighlights();
                state.stickyLink = closest;
                state.stickyLink.classList.add('mobile-hover');

                clearTimeout(state.timers.load);
                state.timers.load = setTimeout(() => {
                    if (state.stickyLink) updatePreview(state.stickyLink.href);
                }, CONFIG.MOBILE_SCROLL_DELAY);
            }
            state.scrollTicking = false;
        };

        const ensureMobileInit = () => {
            if (state.needsLayoutUpdate) recalculateLayout();
            if (!state.stickyLink && imageLinks.length > 0) {
                state.anchorY = CONFIG.DEFAULT_ANCHOR_Y;
                state.stickyLink = imageLinks[0];
                state.stickyLink.classList.add('mobile-hover');
                updatePreview(state.stickyLink.href);
            }
        };

        // --- 5. Event Delegation (Memory Optimization) ---

        // Desktop Hover (Delegated)
        document.body.addEventListener('mouseover', (e) => {
            if (state.isMobile()) return;
            const link = e.target.closest(LINK_SELECTOR);
            
            if (link) {
                clearTimeout(state.timers.hover);
                state.timers.hover = setTimeout(() => {
                    clearHighlights();
                    link.classList.add('mobile-hover');
                    updatePreview(link.href);
                }, CONFIG.DESKTOP_HOVER_DELAY);
            }
        }, { passive: true });

        document.body.addEventListener('mouseout', (e) => {
            if (state.isMobile()) return;
            const link = e.target.closest(LINK_SELECTOR);
            if (link) {
                clearTimeout(state.timers.hover);
                hidePreview();
            }
        }, { passive: true });

        // Navigation Click Guard (Delegated)
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest(LINK_SELECTOR);
            if (!link) return;

            // Desktop: Allow navigation
            if (!state.isMobile()) return;

            // Mobile: Double-tap logic
            if (state.allowClick && state.lastTapped === link) {
                state.allowClick = false;
                return; // Allow default action
            }
            e.preventDefault();
        });

        // Global Scroll
        window.addEventListener('scroll', () => {
            if (!state.isMobile()) return;
            
            if (!state.stickyLink) ensureMobileInit();

            if (!state.scrollTicking) {
                window.requestAnimationFrame(() => updateStickyHighlight(false));
                state.scrollTicking = true;
            }
        }, { passive: true });

        // Global Touch Start
        document.body.addEventListener('touchstart', (e) => {
            if (!state.isMobile()) return;
            if (!state.stickyLink) ensureMobileInit();

            const link = e.target.closest(LINK_SELECTOR);

            if (link) {
                // Explicit interaction updates anchor
                state.anchorY = e.touches[0].clientY;

                if (link === state.lastTapped) {
                    state.allowClick = true;
                } else {
                    state.allowClick = false;
                    state.lastTapped = link;
                    
                    // Instant update
                    clearHighlights();
                    state.stickyLink = link;
                    state.stickyLink.classList.add('mobile-hover');
                    clearTimeout(state.timers.load);
                    updatePreview(state.stickyLink.href);
                }
            } else {
                // Touched empty space -> Just update scroll logic based on existing anchor
                updateStickyHighlight(false);
            }
        }, { passive: true });

        // Global Touch End (Cleanup)
        document.body.addEventListener('touchend', () => {
            if (!state.isMobile()) return;
            updateStickyHighlight(true);
        }, { passive: true });

        // Lifecycle
        window.addEventListener('resize', () => {
            state.needsLayoutUpdate = true;
            if (state.isMobile()) {
                ensureMobileInit();
            } else {
                // Cleanup when going desktop
                if (state.stickyLink) {
                    state.stickyLink = null;
                    hidePreview();
                }
            }
        });

        // Initial Boot
        recalculateLayout();
        if (state.isMobile()) ensureMobileInit();
    }

    initYouTubeEmbeds();
    initImagePreview();
});