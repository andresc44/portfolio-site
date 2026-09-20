(function () {
	'use strict';

	var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
	var ICON_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>';
	var ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';

	function buildLightbox() {
		var el = document.createElement('div');
		el.className = 'pg-lightbox';
		el.hidden = true;
		el.innerHTML =
			'<div class="pg-lightbox__bar">' +
				'<span class="pg-lightbox__count"></span>' +
				'<button type="button" class="pg-lightbox__close" aria-label="Close">' + ICON_CLOSE + '</button>' +
			'</div>' +
			'<div class="pg-lightbox__stage">' +
				'<button type="button" class="pg-lightbox__nav pg-lightbox__nav--prev" aria-label="Previous">' + ICON_PREV + '</button>' +
				'<div class="pg-lightbox__frame"></div>' +
				'<button type="button" class="pg-lightbox__nav pg-lightbox__nav--next" aria-label="Next">' + ICON_NEXT + '</button>' +
			'</div>' +
			'<div class="pg-lightbox__hint">Swipe or use arrow keys to browse &middot; double-tap an image to zoom</div>';
		document.body.appendChild(el);
		return el;
	}

	var lightbox = null;
	var items = [];
	var index = 0;
	var galleryEl = null;

	function readItems(gallery) {
		return Array.prototype.map.call(gallery.querySelectorAll('.project-gallery__item'), function (btn) {
			return {
				type: btn.dataset.type,
				src: btn.dataset.src,
				videoId: btn.dataset.videoId || '',
				alt: btn.dataset.alt || ''
			};
		});
	}

	function renderSlide(frame, item) {
		frame.innerHTML = '';
		frame.style.transform = '';
		var zoomState = { scale: 1, x: 0, y: 0 };
		frame.dataset.zoomed = '0';

		if (item.type === 'image') {
			var img = document.createElement('img');
			img.src = item.src;
			img.alt = item.alt;
			frame.appendChild(img);
			attachZoom(frame, img, zoomState);
		} else if (item.type === 'youtube') {
			var iframe = document.createElement('iframe');
			iframe.src = 'https://www.youtube.com/embed/' + item.videoId + '?autoplay=1&rel=0';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			frame.appendChild(iframe);
		} else if (item.type === 'hosted') {
			var video = document.createElement('video');
			video.src = item.src;
			video.controls = true;
			video.autoplay = true;
			video.playsInline = true;
			frame.appendChild(video);
		}
	}

	function attachZoom(frame, img, state) {
		var pointers = {};
		var startDist = 0;
		var startScale = 1;

		function apply() {
			state.scale = Math.min(Math.max(state.scale, 1), 4);
			if (state.scale === 1) {
				state.x = 0;
				state.y = 0;
			}
			img.style.transform = 'translate(' + state.x + 'px,' + state.y + 'px) scale(' + state.scale + ')';
			frame.dataset.zoomed = state.scale > 1 ? '1' : '0';
		}

		img.addEventListener('dblclick', function (e) {
			e.preventDefault();
			state.scale = state.scale > 1 ? 1 : 2.2;
			state.x = 0;
			state.y = 0;
			apply();
		});

		var lastTap = 0;
		img.addEventListener('touchend', function (e) {
			var now = Date.now();
			if (now - lastTap < 300 && e.changedTouches.length === 1) {
				state.scale = state.scale > 1 ? 1 : 2.2;
				state.x = 0;
				state.y = 0;
				apply();
			}
			lastTap = now;
		});

		img.addEventListener('pointerdown', function (e) {
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			var ids = Object.keys(pointers);
			if (ids.length === 2) {
				var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
				startDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
				startScale = state.scale;
			} else if (ids.length === 1 && state.scale > 1) {
				img.setPointerCapture(e.pointerId);
			}
		});

		img.addEventListener('pointermove', function (e) {
			if (!pointers[e.pointerId]) return;
			var prev = pointers[e.pointerId];
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			var ids = Object.keys(pointers);

			if (ids.length === 2) {
				var p1 = pointers[ids[0]], p2 = pointers[ids[1]];
				var dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
				if (startDist > 0) {
					state.scale = startScale * (dist / startDist);
					apply();
				}
			} else if (ids.length === 1 && state.scale > 1) {
				state.x += e.clientX - prev.x;
				state.y += e.clientY - prev.y;
				apply();
			}
		});

		function release(e) {
			delete pointers[e.pointerId];
			if (Object.keys(pointers).length < 2) startDist = 0;
		}
		img.addEventListener('pointerup', release);
		img.addEventListener('pointercancel', release);
		img.addEventListener('pointerleave', release);
	}

	function show(i) {
		index = (i + items.length) % items.length;
		var frame = lightbox.querySelector('.pg-lightbox__frame');
		renderSlide(frame, items[index]);
		lightbox.querySelector('.pg-lightbox__count').textContent = (index + 1) + ' / ' + items.length;
	}

	function open(gallery, startIndex) {
		if (!lightbox) lightbox = buildLightbox();
		galleryEl = gallery;
		items = readItems(gallery);
		lightbox.hidden = false;
		document.documentElement.style.overflow = 'hidden';
		show(startIndex);
	}

	function close() {
		if (!lightbox) return;
		lightbox.hidden = true;
		lightbox.querySelector('.pg-lightbox__frame').innerHTML = '';
		document.documentElement.style.overflow = '';
	}

	document.addEventListener('click', function (e) {
		var item = e.target.closest('.project-gallery__item');
		if (item) {
			var gallery = item.closest('.project-gallery');
			var idx = Array.prototype.indexOf.call(gallery.querySelectorAll('.project-gallery__item'), item);
			open(gallery, idx);
			return;
		}
		if (!lightbox || lightbox.hidden) return;
		if (e.target.closest('.pg-lightbox__close') || e.target === lightbox) {
			close();
		} else if (e.target.closest('.pg-lightbox__nav--next')) {
			show(index + 1);
		} else if (e.target.closest('.pg-lightbox__nav--prev')) {
			show(index - 1);
		}
	});

	document.addEventListener('keydown', function (e) {
		if (!lightbox || lightbox.hidden) return;
		if (e.key === 'Escape') close();
		else if (e.key === 'ArrowRight') show(index + 1);
		else if (e.key === 'ArrowLeft') show(index - 1);
	});

	// Swipe navigation on the lightbox stage (only when the current slide isn't zoomed in).
	var touchStartX = 0;
	var touchStartY = 0;
	document.addEventListener('touchstart', function (e) {
		if (!lightbox || lightbox.hidden) return;
		var frame = lightbox.querySelector('.pg-lightbox__frame');
		if (frame.dataset.zoomed === '1') return;
		if (!e.target.closest('.pg-lightbox__stage')) return;
		touchStartX = e.changedTouches[0].clientX;
		touchStartY = e.changedTouches[0].clientY;
	}, { passive: true });

	document.addEventListener('touchend', function (e) {
		if (!lightbox || lightbox.hidden) return;
		var frame = lightbox.querySelector('.pg-lightbox__frame');
		if (frame.dataset.zoomed === '1') return;
		if (!touchStartX) return;
		var dx = e.changedTouches[0].clientX - touchStartX;
		var dy = e.changedTouches[0].clientY - touchStartY;
		touchStartX = 0;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
			show(index + (dx < 0 ? 1 : -1));
		}
	}, { passive: true });

	// Mobile strip: update the "x / N" counter as the user scrolls between tiles.
	document.querySelectorAll('.project-gallery').forEach(function (gallery) {
		var counter = gallery.querySelector('.project-gallery__counter');
		if (!counter) return;
		var tiles = gallery.querySelectorAll('.project-gallery__item');
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					var i = Array.prototype.indexOf.call(tiles, entry.target);
					counter.textContent = (i + 1) + ' / ' + tiles.length;
				}
			});
		}, { root: gallery, threshold: 0.6 });
		tiles.forEach(function (t) { io.observe(t); });
	});
})();
