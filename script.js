document.addEventListener('DOMContentLoaded', () => {
    // YouTube Embed Function
    function addEmbedLinks() {
        const paragraphs = document.querySelectorAll('p');

        paragraphs.forEach(p => {
            // Regex to find YouTube links, including optional timestamp
            const youtubeRegex = /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))(?:&t=(\d+)s)?/g;
            let match = youtubeRegex.exec(p.innerHTML);

            if (match) {
                const youtubeLink = match[0];
                const videoId = match[2];
                const startTime = match[3] ? `&start=${match[3]}` : '';

                // Create the '[display]' link
                const embedLink = document.createElement('a');
                embedLink.textContent = '[display]';
                embedLink.style.cursor = 'pointer';
                embedLink.style.marginLeft = '5px';
                embedLink.style.textDecoration = 'underline';

                const spacer = document.createElement('br');
                let iframe = null; // To toggle the iframe

                embedLink.addEventListener('click', (e) => {
                    e.preventDefault();

                    if (!iframe) {
                        // Create and show iframe
                        iframe = document.createElement('iframe');
                        iframe.width = '560';
                        iframe.height = '315';
                        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1${startTime}`;
                        iframe.frameBorder = '0';
                        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe.allowFullscreen = true;
                        iframe.style.marginLeft = '0'; // Align with paragraph

                        p.appendChild(spacer);
                        p.appendChild(iframe);
                    } else {
                        // Remove iframe
                        iframe.remove();
                        spacer.remove();
                        iframe = null;
                    }
                });

                // Ensure the original link is still clickable and opens in a new tab
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
        // Helper function to check viewport based on user's media query
        const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

        // Create the container for the preview image
        const previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview-container';
        // Set styles for "background" image
        previewContainer.style.position = 'fixed';
        previewContainer.style.top = '0';
        previewContainer.style.left = '0';
        previewContainer.style.width = '100vw';
        previewContainer.style.height = '100vh';
        previewContainer.style.zIndex = '-1'; // Place BEHIND page content
        previewContainer.style.pointerEvents = 'none'; // Click-through
        previewContainer.style.display = 'flex'; // Use 'flex' to enable centering
        previewContainer.style.alignItems = 'center';
        previewContainer.style.justifyContent = 'center';
        previewContainer.style.display = 'none'; // Start hidden

        const previewImg = document.createElement('img');
        previewImg.style.maxWidth = '100%';
        previewImg.style.maxHeight = '100%';
        // objectFit is set conditionally below
        previewContainer.appendChild(previewImg);
        document.body.appendChild(previewContainer); 

        // --- Mobile-Specific State ---
        let currentStickyLink = null;
        let imageLoadTimer = null; // Debouncer for loading images on scroll stop
        const VIEWPORT_ANCHOR_Y = 10; // Default anchor: 10px from top
        let anchorY = VIEWPORT_ANCHOR_Y; // Current anchor, can be changed by tap
        
        // --- Desktop-Only State ---
        let hoverTimer = null; // Debouncer for mouse hover

        // Simple LRU cache for images
        const imageCache = new Map();
        const MAX_CACHE_SIZE = 50;

        function cacheImage(src) {
            // Check cache
            if (imageCache.has(src)) {
                // Move to end of map to mark as recently used
                const cached = imageCache.get(src);
                imageCache.delete(src);
                imageCache.set(src, cached);
                return cached;
            }

            // Not in cache, create new image
            const newImg = new Image();
            newImg.src = src;

            // Evict oldest entry if cache is full
            if (imageCache.size >= MAX_CACHE_SIZE) {
                const oldestKey = imageCache.keys().next().value;
                imageCache.delete(oldestKey);
            }

            imageCache.set(src, newImg);
            return newImg;
        }

        // Function to load and show the image in its container
        function showImage(src) {
            previewImg.style.display = 'none'; // Hide while loading
            const cached = cacheImage(src);

            // Show image once loaded
            const displayImage = () => {
                previewImg.src = cached.src;
                previewImg.style.display = 'block';
                previewContainer.style.display = 'flex'; // Use 'flex' to enable centering
            };

            if (cached.complete) {
                displayImage();
            } else {
                cached.onload = displayImage;
            }
        }

        // Function to remove highlights from all links
        function clearAllHighlights() {
            imageLinks.forEach(link => link.classList.remove('mobile-hover'));
        }

        // Function to hide the container and remove mobile highlight
        function hideImage() {
            previewContainer.style.display = 'none';
            clearAllHighlights(); // Clear all highlights when hiding
        }

        // --- Find all image links ---
        const imageLinks = document.querySelectorAll('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".JPG"], a[href$=".JPEG"], a[href$=".PNG"], a[href$=".GIF"], a[href$=".webp"], a[href$=".WEBP"]');

        // --- Desktop-Only Logic ---
        imageLinks.forEach(link => {
            const src = link.href;

            // Hover behavior for desktop
            link.addEventListener('mouseenter', () => {
                if (isMobile()) return; // Gated by viewport
                
                clearTimeout(hoverTimer); // Clear any existing timer
                hoverTimer = setTimeout(() => {
                    // Set desktop position to background
                    previewContainer.style.zIndex = '-1'; // Desktop shows BEHIND
                    
                    // DESKTOP: Show full image, constrained
                    previewImg.style.width = 'auto';
                    previewImg.style.height = 'auto';
                    previewImg.style.maxWidth = '100%';
                    previewImg.style.maxHeight = '100%';
                    previewImg.style.objectFit = 'contain'; 

                    // Add persistent highlight
                    clearAllHighlights();
                    link.classList.add('mobile-hover');
                    
                    showImage(src);
                }, 150); // 150ms debounce
            });

            link.addEventListener('mouseleave', () => {
                if (isMobile()) return; // Gated by viewport
                clearTimeout(hoverTimer);
                hideImage(); // This will hide the image and call clearAllHighlights()
            });
        });

        // --- Mobile-Only Logic ---

        // Function to find the closest link to the anchor and update highlight
        function updateHighlightOnScroll() {
            // Find the link closest to our anchor position
            let minDiff = Infinity;
            let closestLink = null;

            imageLinks.forEach(link => {
                const rect = link.getBoundingClientRect();
                // Skip links that are not visible or off-screen
                if (rect.width === 0 && rect.height === 0) return; 

                const diff = Math.abs(rect.top - anchorY);

                if (diff < minDiff) {
                    minDiff = diff;
                    closestLink = link;
                }
            });

            // Update highlight if the closest link has changed
            if (closestLink && closestLink !== currentStickyLink) {
                clearAllHighlights();
                currentStickyLink = closestLink;
                currentStickyLink.classList.add('mobile-hover');
            }

            // Debounce the image loading
            clearTimeout(imageLoadTimer);
            imageLoadTimer = setTimeout(() => {
                if (currentStickyLink) {
                    showImage(currentStickyLink.href);
                }
            }, 150); // Load image 150ms after scroll/highlight stops
        }

        // Initial setup for mobile
        if (isMobile()) {
            
            // MOBILE: Show full image, constrained (margins top/bottom for landscape)
            previewImg.style.width = 'auto'; // Reset to default
            previewImg.style.height = 'auto'; // Reset to default
            previewImg.style.objectFit = 'contain'; // Show full image, creating margins
            previewImg.style.maxWidth = '100%'; // Restore default constraint
            previewImg.style.maxHeight = '100%'; // Restore default constraint


            if (imageLinks.length > 0) {
                // 1. Set default state on load
                anchorY = VIEWPORT_ANCHOR_Y;
                currentStickyLink = imageLinks[0];
                currentStickyLink.classList.add('mobile-hover');
                
                // 2. Show the first image
                showImage(currentStickyLink.href);

                // 3. Set up listeners
                window.addEventListener('scroll', () => {
                    if (!isMobile()) return; // Re-check, viewport could change
                    // Only run scroll logic if a link is active or was just tapped off
                    if (currentStickyLink || anchorY !== VIEWPORT_ANCHOR_Y) { 
                        updateHighlightOnScroll();
                    }
                });

                document.body.addEventListener('touchstart', (e) => {
                    if (!isMobile()) return; // Gated by viewport

                    const tappedLink = e.target.closest('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".gif"], a[href$=".JPG"], a[href$=".JPEG"], a[href$=".PNG"], a[href$=".GIF"], a[href$=".webp"], a[href$=".WEBP"]');
                    
                    if (tappedLink) {
                        // --- Tapped on a link ---
                        e.preventDefault();
                        anchorY = e.touches[0].clientY; // Set new anchor
                        
                        // Manually trigger update
                        clearAllHighlights();
                        currentStickyLink = tappedLink;
                        currentStickyLink.classList.add('mobile-hover');
                        
                        // Clear any pending image load and load this one immediately
                        clearTimeout(imageLoadTimer);
                        showImage(currentStickyLink.href);

                    } else if (e.target.closest('a') === null) { 
                        // --- Tapped off a link (and not on any other link) ---
                        hideImage();
                        currentStickyLink = null;
                        anchorY = VIEWPORT_ANCHOR_Y; // Reset anchor
                    }
                    // If tapped on another link (like YouTube), do nothing
                });
            }
        }
    }

    // Initialize functions
    addEmbedLinks();
    enableImageInteraction();
});