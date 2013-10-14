/* jshint browser:true, jquery: true */

var d3 = require('d3');
var david = require('./david');

$('#search-page').each(function () {

	var dependencyCounts = {}
		, searchForm = $('form');

	searchForm.submit(function (event) {
		event.preventDefault();
	});

	var searchField = $('input', searchForm)
		, searchTimeoutId = null;

	// Perform a search for keyword q, optionally pushing state onto browser history
	function search(q, pushState) {
		var data = {};

		if (!$('.loading', searchForm).length) {
			searchForm.append(david.createLoadingEl(' Searching...'));
		}

		david.renderDependencyCountsGraph({});

		$.getJSON('/search.json', { q: q }, function (results) {
			$('.loading', searchForm).remove();

			if (!Object.keys(results).length) {
				data = dependencyCounts;
			} else {
				Object.keys(results).forEach(function (pkgName) {
					data[pkgName] = results[pkgName].count + 1;
				});
			}

			david.renderDependencyCountsGraph(data);

			if (pushState && history.pushState) {
				history.pushState({ q: q }, 'Searching for ' + q, $.param.querystring(window.location + '', { q: q }));
			}
		});
	}

	var lastQ = null;

	searchField.keyup(function () {
		var q = searchField.val();

		if (q !== lastQ) {

			clearTimeout(searchTimeoutId);

			if (!q.length) {
				david.renderDependencyCountsGraph(dependencyCounts);
			} else if (q.length > 2) {
				searchTimeoutId = setTimeout(function () {
					search(q);
				}, 1000);
			}

			lastQ = q;
		}
	});

	// Do search on popstate
	if (window.addEventListener) {
		window.addEventListener('popstate', function (event) {
			if (event.state) {
				searchField.val(event.state.q);
				search(event.state.q, false);
			}
		});
	}

	// Get the dependency counts
	d3.json('dependency-counts.json', function (error, data) {
		dependencyCounts = data;

		if (searchField.val()) {
			var state = { q: searchField.val() };

			if (history.replaceState) {
				history.replaceState(state, 'Searching for ' + state.q, $.param.querystring(window.location + '', state));
			}

			search(searchField.val(), false);

		} else {
			david.renderDependencyCountsGraph(data);
		}
	});
});
