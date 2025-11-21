@@ -44,33 +44,84 @@ document.addEventListener('DOMContentLoaded', () => {
    }

    // Add event listeners to all links and preload images
    document.querySelectorAll('a').forEach(link => {
        // Check if the link's href ends with an image extension
        if (link.href.match(/\.(jpeg|jpg|gif|png)$/i)) {
            // Preload the image
            preloadImage(link.href);

            // Show the image in the container on hover
            link.addEventListener('mouseover', (e) => {
                e.preventDefault();
                showImage(link.href);
            });
    function addHoverListeners() {
        document.querySelectorAll('a').forEach(link => {
            // Check if the link's href ends with an image extension
            if (link.href.match(/\.(jpeg|jpg|gif|png)$/i)) {
                // Preload the image
                preloadImage(link.href);

            // Hide the image when not hovering
            link.addEventListener('mouseout', (e) => {
                e.preventDefault();
                hideImage();
            });
                // Show the image in the container on hover
                link.addEventListener('mouseover', showImageOnHover);
                // Hide the image when not hovering
                link.addEventListener('mouseout', hideImageOnHover);
            }
        });
    }

    // Remove hover listeners
    function removeHoverListeners() {
        document.querySelectorAll('a').forEach(link => {
            if (link.href.match(/\.(jpeg|jpg|gif|png)$/i)) {
                link.removeEventListener('mouseover', showImageOnHover);
                link.removeEventListener('mouseout', hideImageOnHover);
            }
        });
    }

    // Hover event handlers
    function showImageOnHover(e) {
        e.preventDefault();
        showImage(this.href);
    }

    function hideImageOnHover(e) {
        e.preventDefault();
        hideImage();
    }

            // Allow clicking to load the image
            link.addEventListener('click', (e) => {
                hideImage();  // Optional: hide the hover image before following the link
    // Add Intersection Observer for narrow viewports
    function enableMobileImageDisplay() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target.href.match(/\.(jpeg|jpg|gif|png)$/i)) {
                    showImage(entry.target.href);
                } else {
                    hideImage();
                }
            });
        });

        document.querySelectorAll('a').forEach(link => {
            if (link.href.match(/\.(jpeg|jpg|gif|png)$/i)) {
                observer.observe(link);
            }
        });
        return observer;
    }

    // Enable or disable features based on viewport width
    let currentObserver = null;

    function checkViewportWidth() {
        const viewportWidth = window.innerWidth;

        if (viewportWidth > 900) {
            if (currentObserver) {
                currentObserver.disconnect();
                currentObserver = null;
            }
            removeHoverListeners();
            addHoverListeners();
        } else {
            // For non-image links, allow default action
            link.addEventListener('click', (e) => {
                // Do not prevent default action, so the link works normally
            });
            removeHoverListeners();
            if (!currentObserver) {
                currentObserver = enableMobileImageDisplay();
            }
        }
    });
    }

    // Initial check and add resize event listener
    checkViewportWidth();
    window.addEventListener('resize', checkViewportWidth);
});