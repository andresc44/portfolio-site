(function () {
	'use strict';

	var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
	var ICON_PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>';
	var ICON_NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>';
	var ICON_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14"/></svg>';

	function buildLightbox() {
		var el = document.createElement('div');
		el.className = 'pg-lightbox';
		el.hidden = true;
		el.innerHTML =
			'<div class="pg-lightbox__bar">' +
				'<span class="pg-lightbox__count"></span>' +
				'<div class="pg-lightbox__actions">' +
					'<a class="pg-lightbox__download" download aria-label="Download" title="Download">' + ICON_DOWNLOAD + '</a>' +
					'<button type="button" class="pg-lightbox__close" aria-label="Close">' + ICON_CLOSE + '</button>' +
				'</div>' +
			'</div>' +
			'<div class="pg-lightbox__stage">' +
				'<button type="button" class="pg-lightbox__nav pg-lightbox__nav--prev" aria-label="Previous">' + ICON_PREV + '</button>' +
				'<div class="pg-lightbox__frame"></div>' +
				'<button type="button" class="pg-lightbox__nav pg-lightbox__nav--next" aria-label="Next">' + ICON_NEXT + '</button>' +
			'</div>' +
			'<div class="pg-lightbox__caption"></div>' +
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
				alt: btn.dataset.alt || '',
				caption: btn.dataset.caption || '',
				poster: btn.dataset.poster || '',
				hq: btn.dataset.hq || '',
				original: btn.dataset.original || ''
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
			// The viewer shows the picture at its full resolution: the web-sized
			// copy first (instant), swapped for the full-resolution one when that
			// has loaded. (The download is the original file - see below.)
			if (item.hq && item.hq !== item.src) {
				var full = new Image();
				full.onload = function () {
					if (img.parentNode === frame) img.src = item.hq;
				};
				full.src = item.hq;
			}
		} else if (item.type === 'youtube') {
			var iframe = document.createElement('iframe');
			iframe.src = 'https://www.youtube.com/embed/' + item.videoId + '?autoplay=1&rel=0';
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			frame.appendChild(iframe);
		} else if (item.type === 'hosted') {
			var video = document.createElement('video');
			video.src = item.src;
			if (item.poster) video.poster = item.poster;
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

	// While the viewer is open, the pictures either side of the current one are
	// fetched in advance (full-resolution copy where there is one), so a step to
	// the next or previous is instant. Only ever called from show(), i.e. only
	// when the viewer is actually open.
	var warm = {};
	function warmNeighbours() {
		[-1, 1].forEach(function (d) {
			var it = items[(index + d + items.length) % items.length];
			if (!it || it.type !== 'image') return;
			[it.src, it.hq].forEach(function (u) {
				if (u && !warm[u]) { warm[u] = new Image(); warm[u].src = u; }
			});
		});
	}

	function show(i) {
		index = (i + items.length) % items.length;
		setTimeout(warmNeighbours, 0);
		var frame = lightbox.querySelector('.pg-lightbox__frame');
		renderSlide(frame, items[index]);
		lightbox.querySelector('.pg-lightbox__count').textContent = (index + 1) + ' / ' + items.length;
		var caption = lightbox.querySelector('.pg-lightbox__caption');
		caption.textContent = items[index].caption || '';
		// keep the row out of the flow entirely when a slide has no caption,
		// so the stage doesn't lose height to an empty band
		caption.hidden = !items[index].caption;

		// YouTube has no direct file to hand over, so its link is hidden unless the
		// item carries its own original file (data-original): then that file is
		// offered as a plain download, never run through the PNG saver.
		var dl = lightbox.querySelector('.pg-lightbox__download');
		var current = items[index];
		if (current.type === 'youtube' && !current.original) {
			dl.hidden = true;
		} else {
			dl.hidden = false;
			dl.href = current.original || current.src;
			// Saved under the picture's own name: the "p2709-" project-id prefix
			// the files carry on the server is bookkeeping, not something to
			// put on a visitor's disk.
			var name = ((current.original || current.src).split('/').pop().split('?')[0] || 'download').replace(/^p\d+-/, '');
			dl.setAttribute('download', name);
		}
	}

	// Pushing a history entry when the lightbox opens means the device/browser
	// back action (button, edge-swipe, or Android gesture) closes the lightbox
	// instead of leaving the project page entirely - without this, "back" while
	// viewing a slide just navigated away, which read as broken everywhere the
	// gallery is used.
	var pushedState = false;

	function open(gallery, startIndex) {
		if (!lightbox) lightbox = buildLightbox();
		galleryEl = gallery;
		items = readItems(gallery);
		lightbox.hidden = false;
		document.documentElement.style.overflow = 'hidden';
		show(startIndex);
		history.pushState({ pgLightbox: true }, '', location.href);
		pushedState = true;
	}

	function close(fromPopstate) {
		if (!lightbox || lightbox.hidden) return;
		lightbox.hidden = true;
		lightbox.querySelector('.pg-lightbox__frame').innerHTML = '';
		document.documentElement.style.overflow = '';
		if (pushedState) {
			pushedState = false;
			if (!fromPopstate) history.back();
		}
	}

	window.addEventListener('popstate', function () {
		if (lightbox && !lightbox.hidden) close(true);
	});

	document.addEventListener('click', function (e) {
		var item = e.target.closest('.project-gallery__item');
		if (item) {
			var gallery = item.closest('.project-gallery');
			var idx = Array.prototype.indexOf.call(gallery.querySelectorAll('.project-gallery__item'), item);
			open(gallery, idx);
			return;
		}
		if (!lightbox || lightbox.hidden) return;
		if (e.target.closest('.pg-lightbox__download')) {
			// A picture is saved as a PNG (the saver lives in lightbox-toolbar);
			// anything else, or no saver, falls through to the link's own file.
			var cur = items[index];
			if (cur && cur.type === 'image' && window.portfolioDownloadPng) {
				e.preventDefault();
				window.portfolioDownloadPng(cur.original || cur.src);
			}
			return;
		}
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
	// The old version measured distance once at touchend and swapped the slide's
	// innerHTML outright - the image just vanished and the next one appeared with
	// no motion in between. This tracks the finger during touchmove instead: a
	// second "incoming" frame slides in alongside the current one at a 1:1 offset
	// while dragging, then on release either finishes the slide (swipe past the
	// threshold) or springs back (short swipe), both as an actual animated
	// transform rather than a content swap.
	//
	// The incoming frame renders a cheap static preview (image, or a video/
	// YouTube poster with no playback) rather than the full renderSlide output,
	// so a cancelled drag never starts an iframe or video loading/autoplaying
	// just from a touch that didn't commit. The real renderSlide only runs once
	// the swipe is committed, via the existing show().
	function renderPreview(frame, item) {
		frame.innerHTML = '';
		if (item.type === 'image') {
			var img = document.createElement('img');
			img.src = item.src;
			img.alt = item.alt;
			frame.appendChild(img);
		} else if (item.type === 'youtube') {
			var poster = document.createElement('img');
			poster.src = item.poster || 'https://img.youtube.com/vi/' + item.videoId + '/maxresdefault.jpg';
			poster.alt = item.alt;
			// Not every video has a maxres thumbnail generated - fall back to
			// the guaranteed-to-exist (but softer) hqdefault if it 404s.
			poster.onerror = function () {
				poster.onerror = null;
				poster.src = 'https://img.youtube.com/vi/' + item.videoId + '/hqdefault.jpg';
			};
			frame.appendChild(poster);
		} else if (item.type === 'hosted') {
			var video = document.createElement('video');
			video.src = item.src + '#t=0.1';
			if (item.poster) video.poster = item.poster;
			video.preload = 'metadata';
			video.playsInline = true;
			frame.appendChild(video);
		}
	}

	var drag = null;
	document.addEventListener('touchstart', function (e) {
		if (!lightbox || lightbox.hidden) return;
		var frame = lightbox.querySelector('.pg-lightbox__frame');
		if (frame.dataset.zoomed === '1') return;
		if (!e.target.closest('.pg-lightbox__stage')) return;
		drag = {
			startX: e.changedTouches[0].clientX,
			startY: e.changedTouches[0].clientY,
			dx: 0,
			dragging: false,
			currentFrame: frame,
			incoming: null,
			dir: 0,
			incomingIndex: index
		};
	}, { passive: true });

	document.addEventListener('touchmove', function (e) {
		if (!drag) return;
		var x = e.changedTouches[0].clientX;
		var y = e.changedTouches[0].clientY;
		var dx = x - drag.startX;
		var dy = y - drag.startY;

		if (!drag.dragging) {
			if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
			drag.dragging = true;
			var stage = lightbox.querySelector('.pg-lightbox__stage');
			drag.dir = dx < 0 ? 1 : -1; // 1 = advancing to next, -1 = back to prev
			drag.incomingIndex = (index + drag.dir + items.length) % items.length;
			var incoming = document.createElement('div');
			incoming.className = 'pg-lightbox__frame';
			renderPreview(incoming, items[drag.incomingIndex]);
			stage.appendChild(incoming);
			drag.currentFrame.style.position = 'absolute';
			drag.currentFrame.style.inset = '0';
			drag.currentFrame.style.transition = 'none';
			incoming.style.position = 'absolute';
			incoming.style.inset = '0';
			incoming.style.transition = 'none';
			incoming.style.transform = 'translateX(' + (drag.dir * 100) + '%)';
			drag.incoming = incoming;
		}

		drag.dx = dx;
		var stageW = lightbox.querySelector('.pg-lightbox__stage').clientWidth || 1;
		var pct = (dx / stageW) * 100;
		drag.currentFrame.style.transform = 'translateX(' + pct + '%)';
		if (drag.incoming) {
			drag.incoming.style.transform = 'translateX(' + (drag.dir * 100 + pct) + '%)';
		}
	}, { passive: true });

	document.addEventListener('touchend', function () {
		if (!drag) return;
		var d = drag;
		drag = null;
		if (!d.dragging) return;

		var stageW = lightbox.querySelector('.pg-lightbox__stage').clientWidth || 1;
		var threshold = Math.min(80, stageW * 0.18);
		var commit = Math.abs(d.dx) > threshold;
		var easing = 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)';
		d.currentFrame.style.transition = easing;
		if (d.incoming) d.incoming.style.transition = easing;

		if (commit) {
			d.currentFrame.style.transform = 'translateX(' + (-d.dir * 100) + '%)';
			if (d.incoming) d.incoming.style.transform = 'translateX(0%)';
		} else {
			d.currentFrame.style.transform = 'translateX(0%)';
			if (d.incoming) d.incoming.style.transform = 'translateX(' + (d.dir * 100) + '%)';
		}

		setTimeout(function () {
			if (d.incoming && d.incoming.parentNode) d.incoming.parentNode.removeChild(d.incoming);
			d.currentFrame.style.position = '';
			d.currentFrame.style.inset = '';
			d.currentFrame.style.transition = '';
			d.currentFrame.style.transform = '';
			if (commit) show(d.incomingIndex);
		}, 300);
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
