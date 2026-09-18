(function () {
    "use strict";

    function initButton() {
        var buttonPath = document.querySelector('.smooth-back-to-top-button path, .smooth-back-to-top-button rect');

        if (!buttonPath) {
            return;
        }

        var pathLength = buttonPath.getTotalLength();

        buttonPath.style.strokeDasharray = pathLength + ' ' + pathLength;
        buttonPath.style.strokeDashoffset = pathLength;

        var isTicking = false;

        var updateButtonProgress = function () {
            var scroll = window.scrollY;
            var height = document.documentElement.scrollHeight - window.innerHeight;

            // Calculate progress, handling division by zero if page is smaller than viewport
            var progress = height > 0 ? pathLength - (scroll * pathLength / height) : pathLength;

            buttonPath.style.strokeDashoffset = progress;
            isTicking = false;
        };

        var onScroll = function () {
            if (!isTicking) {
                window.requestAnimationFrame(updateButtonProgress);
                isTicking = true;
            }
        };

        updateButtonProgress();

        // Use passive listener for better scroll performance on mobile
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initButton);
    } else {
        initButton();
    }
})();