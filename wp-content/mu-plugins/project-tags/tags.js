(function () {
	'use strict';
	if (typeof ProjectTags === 'undefined') return;

	var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
	var cache = {};
	var modal = null;

	function buildModal() {
		var el = document.createElement('div');
		el.className = 'pt-modal';
		el.hidden = true;
		el.innerHTML =
			'<div class="pt-modal__panel" role="dialog" aria-modal="true">' +
				'<div class="pt-modal__header">' +
					'<div>' +
						'<h3 class="pt-modal__title"></h3>' +
						'<p class="pt-modal__subtitle"></p>' +
					'</div>' +
					'<button type="button" class="pt-modal__close" aria-label="Close">' + ICON_CLOSE + '</button>' +
				'</div>' +
				'<div class="pt-modal__list"></div>' +
			'</div>';
		document.body.appendChild(el);
		return el;
	}

	function escapeHtml(s) {
		var d = document.createElement('div');
		d.textContent = s || '';
		return d.innerHTML;
	}

	function renderList(container, data) {
		if (!data.projects || !data.projects.length) {
			container.innerHTML = '<div class="pt-modal__empty">No other projects use this tag yet.</div>';
			return;
		}
		container.innerHTML = data.projects.map(function (p) {
			var meta = [];
			if (p.category) meta.push('<span class="cat">' + escapeHtml(p.category) + '</span>');
			if (p.subcategory) meta.push(escapeHtml(p.subcategory));
			return (
				'<button type="button" class="pt-modal__item" data-url="' + escapeHtml(p.url) + '">' +
					'<span class="pt-modal__item-title">' + escapeHtml(p.title) + '</span>' +
					(meta.length ? '<span class="pt-modal__item-meta">' + meta.join(' &middot; ') + '</span>' : '') +
				'</button>'
			);
		}).join('');
	}

	function open(slug, name) {
		if (!modal) modal = buildModal();
		modal.hidden = false;
		document.documentElement.style.overflow = 'hidden';

		var title = modal.querySelector('.pt-modal__title');
		var subtitle = modal.querySelector('.pt-modal__subtitle');
		var list = modal.querySelector('.pt-modal__list');
		title.textContent = name;
		subtitle.textContent = 'Loading…';
		list.innerHTML = '<div class="pt-modal__loading">Loading…</div>';

		var key = slug;
		var request = cache[key]
			? Promise.resolve(cache[key])
			: fetch(ProjectTags.restUrl + '/' + slug + '?exclude=' + ProjectTags.postId)
				.then(function (r) { return r.json(); })
				.then(function (data) { cache[key] = data; return data; });

		request.then(function (data) {
			if (modal.hidden) return; // closed before response arrived
			if (modal.querySelector('.pt-modal__title').textContent !== name) return; // a newer tag was opened meanwhile
			var count = data.total || 0;
			subtitle.textContent = count === 1 ? '1 other project uses this tag' : count + ' other projects use this tag';
			renderList(list, data);
		}).catch(function () {
			subtitle.textContent = '';
			list.innerHTML = '<div class="pt-modal__empty">Couldn’t load related projects.</div>';
		});
	}

	function close() {
		if (!modal) return;
		modal.hidden = true;
		document.documentElement.style.overflow = '';
	}

	document.addEventListener('click', function (e) {
		var pill = e.target.closest('.project-tags__pill');
		if (pill) {
			open(pill.dataset.tagSlug, pill.dataset.tagName);
			return;
		}
		if (!modal || modal.hidden) return;
		var item = e.target.closest('.pt-modal__item');
		if (item) {
			window.location.href = item.dataset.url;
			return;
		}
		if (e.target.closest('.pt-modal__close') || e.target === modal) {
			close();
		}
	});

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && modal && !modal.hidden) close();
	});
})();
