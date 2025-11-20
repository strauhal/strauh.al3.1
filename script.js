document.addEventListener('DOMContentLoaded', () => {
    // YouTube Embed Function
    function addEmbedLinks() {
        const paragraphs = document.querySelectorAll('p');

        paragraphs.forEach(p => {
            const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))(?:&t=(\d+)s)?/g;
            let match = youtubeRegex.exec(p.innerHTML);

            if (match) {
                const youtubeLink = match[0];
                const videoId = match[2];
                const startTime = match[3] ? `&start=${match[3]}` : '';

                const embedLink = document.createElement('a');
                embedLink.textContent = '[display]';
                embedLink.style.cursor = 'pointer';
                embedLink.style.marginLeft = '5px';
                embedLink.style.textDecoration = 'underline';

                const spacer = document.createElement('br');
                let iframe = null;

                embedLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!iframe) {
                        iframe = document.createElement('iframe');
                        iframe.width = '560';
                        iframe.height = '315';
                        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1${startTime}`;
                        iframe.frameBorder = '0';
                        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe.allowFullscreen = true;
                        iframe.style.marginLeft = '0';
                        p.appendChild(spacer);
                        p.appendChild(iframe);
                    } else {
                        iframe.remove();
                        spacer.remove();
                        iframe = null;
                    }
                });

                const originalLink = p.querySelector(`a[href="${youtubeLink}"]`);
                if (!originalLink) {
                     p.innerHTML = p.innerHTML.replace(youtubeLink, `<a href="${youtubeLink}" target="_blank">${youtubeLink}</a>`);
                }
                p.appendChild(embedLink);
            }
        });
    }

    // Desktop Hover and Mobile Tap for Images
    function enableImageInteraction() {
        const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

        // Create container
        const previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview-container';
        previewContainer.style.position = 'fixed';
        previewContainer.style.top = '0';
        previewContainer.style.left = '0';
        previewContainer.style.width = '100vw';
        previewContainer.style.height = '100vh';
        previewContainer.style.zIndex = '-1'; 
        previewContainer.style.pointerEvents = 'none';
        previewContainer.style.display = 'none'; // Start hidden
        previewContainer.style.flexDirection = 'column'; // For centering
        previewContainer.style.alignItems = 'center';
        previewContainer.style.justifyContent = 'center';

        const previewImg = document.createElement('img');
        // Default styles
        previewImg.style.maxWidth = '100%';
        previewImg.style.maxHeight = '100%';
        
        previewContainer.appendChild(previewImg);
        document.body.appendChild(previewContainer); 

        let currentStickyLink = null;
        let imageLoadTimer = null; 
        const VIEWPORT_ANCHOR_Y = 10; 
        let anchorY = VIEWPORT_ANCHOR_Y; 
        let hoverTimer = null; 

        // New State for Double-Tap Logic
        let lastTappedLink = null;
        let allowNextClick = false;

        const imageCache = new Map();
        const MAX_CACHE_SIZE = 50;

        function cacheImage(src) {
            if (imageCache.has(src)) {
                const cached = imageCache.get(src);
                imageCache.delete(src);
                imageCache.set(src, cached);
                return cached;
            }
            const newImg = new Image();
            newImg.src = src;
            if (imageCache.size >= MAX_CACHE_SIZE) {
                const oldestKey = imageCache.keys().next().value;
                imageCache.delete(oldestKey);
            }
            imageCache.set(src, newImg);
            return newImg;
        }

        function showImage(src) {
            previewImg.style.display = 'none';
            const cached = cacheImage(src);
            
            // Ensure container is visible (flex)
            previewContainer.style.display = 'flex';

            const displayImage = () => {
                previewImg.src = cached.src;
                previewImg.style.display = 'block';
            };

            if (cached.complete) {
                displayImage();
            } else {
                cached.onload = displayImage;
            }
        }

        function clearAllHighlights() {
            imageLinks.forEach(link => link.classList.remove('mobile-hover'));
        }

        function hideImage() {
            previewContainer.style.display = 'none';
            clearAllHighlights();
        }

        const imageLinks = document.querySelectorAll('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".JPG"], a[href$=".JPEG"], a[href$=".PNG"], a[href$=".GIF"], a[href$=".webp"], a[href$=".WEBP"]');

        // -------------------------
        // Shared / Mobile Logic Helpers
        // -------------------------
        
        function ensureMobileInit() {
            if (!currentStickyLink && imageLinks.length > 0) {
                anchorY = VIEWPORT_ANCHOR_Y;
                currentStickyLink = imageLinks[0];
                currentStickyLink.classList.add('mobile-hover');
                
                // Apply Mobile Styles
                previewImg.style.width = 'auto';
                previewImg.style.height = 'auto';
                previewImg.style.maxWidth = '100%';
                previewImg.style.maxHeight = '100%';
                previewImg.style.objectFit = 'contain';

                showImage(currentStickyLink.href);
            }
        }

        function updateHighlightOnScroll() {
            let minDiff = Infinity;
            let closestLink = null;

            imageLinks.forEach(link => {
                const rect = link.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return; 
                const diff = Math.abs(rect.top - anchorY);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestLink = link;
                }
            });

            if (closestLink && closestLink !== currentStickyLink) {
                clearAllHighlights();
                currentStickyLink = closestLink;
                currentStickyLink.classList.add('mobile-hover');
            }

            clearTimeout(imageLoadTimer);
            imageLoadTimer = setTimeout(() => {
                if (currentStickyLink) {
                    showImage(currentStickyLink.href);
                }
            }, 150);
        }

        // -------------------------
        // Event Listeners
        // -------------------------

        // 1. Link Interaction
        imageLinks.forEach(link => {
            const src = link.href;

            // CLICK HANDLER: Manages the "Double Tap" logic
            link.addEventListener('click', (e) => {
                if (isMobile()) {
                    if (allowNextClick) {
                        allowNextClick = false; // Reset
                        return; // Allow default navigation (open image)
                    }
                }
                e.preventDefault(); // Prevent navigation otherwise (viewer mode)
            });

            // HOVER HANDLER: Desktop Only
            link.addEventListener('mouseenter', () => {
                if (isMobile()) return; 
                
                clearTimeout(hoverTimer);
                // Reset styles for desktop
                previewContainer.style.zIndex = '-1';
                previewImg.style.width = 'auto';
                previewImg.style.height = 'auto';
                previewImg.style.maxWidth = '100%';
                previewImg.style.maxHeight = '100%';
                previewImg.style.objectFit = 'contain'; 

                clearAllHighlights();
                link.classList.add('mobile-hover');
                showImage(src);
            });

            link.addEventListener('mouseleave', () => {
                if (isMobile()) return;
                hideImage();
            });
        });

        // 2. Scroll Listener
        window.addEventListener('scroll', () => {
            if (!isMobile()) return;
            if (!currentStickyLink) ensureMobileInit();
            updateHighlightOnScroll();
        });

        // 3. Touch Listener (Global)
        document.body.addEventListener('touchstart', (e) => {
            if (!isMobile()) return;

            if (!currentStickyLink) ensureMobileInit();

            const tappedLink = e.target.closest('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".JPG"], a[href$=".JPEG"], a[href$=".PNG"], a[href$=".GIF"], a[href$=".webp"], a[href$=".WEBP"]');
            
            if (tappedLink) {
                // Update anchor to the specific link tap
                anchorY = e.touches[0].clientY;

                // CHECK FOR DOUBLE TAP (Selection vs Navigation)
                if (tappedLink === lastTappedLink) {
                    allowNextClick = true; // Next 'click' event will allowed
                    // We don't need to update visuals, it's already selected
                } else {
                    allowNextClick = false; // Block 'click' event
                    lastTappedLink = tappedLink; // Set as current selection

                    // Update Visuals (Select the new link)
                    clearAllHighlights();
                    currentStickyLink = tappedLink;
                    currentStickyLink.classList.add('mobile-hover');
                    
                    clearTimeout(imageLoadTimer);
                    showImage(currentStickyLink.href);
                }
            } else {
                // Tap on blank space: Just update highlight based on scrolling logic
                // Note: This does NOT change the anchorY, so the anchor stays "locked" 
                // to the last tapped link position until you tap another link.
                updateHighlightOnScroll();
            }
        }, { passive: true });

        // 4. Resize/Load check
        const checkInit = () => {
            if (isMobile()) ensureMobileInit();
            else {
                if (currentStickyLink) {
                    clearAllHighlights();
                    currentStickyLink = null;
                    previewContainer.style.display = 'none';
                }
            }
        };
        window.addEventListener('resize', checkInit);
        checkInit(); 
    }

    addEmbedLinks();
    enableImageInteraction();
});