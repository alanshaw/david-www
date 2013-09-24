/* jshint jquery:true, browser:true */
/*global d3, David, Handlebars, moment*/

$('#home-page').each(function () {

	// Render the dependency counts graph
	d3.json('dependency-counts.json', function (er, data) {
		if (er) {
			return console.error('Failed to get dependency counts', er);
		}
		David.renderDependencyCountsGraph(data);
	});

	var url = $('.badge-maker span')
		, badge = $('.badge-maker img');

	// Update the image when the user changes the url
	url.on('input', function () {
		badge.attr('src', url.text() + '.png');
	});

	// Red text if the url isn't good for it.
	badge.error(function () {
		url.addClass('nope');
		badge.hide();
	});

	// Green text if it is... wait a minute should this be tied to repo health not.
	badge.load(function () {
		if (badge.attr('src') === '/img/outofdate.png') {
			return;
		}
		url.removeClass('nope');
		badge.show();
	});

	/* RSS feed */
	$.getFeed({
		url: '/news/rss.xml',
		success: function (feed) {
			var entry = feed.items[0];

			entry.shortDesc = $('<div/>').html(entry.description).text().substr(0, 200);
			entry.datetime = moment(entry.updated).format();
			entry.formattedDate = moment(entry.updated).format('MMMM Do YYYY, HH:mm');

			$.get('/inc/news.html', function (tpl) {
				$('#stats').append(Handlebars.compile(tpl)(entry));
			});
		}
	});
});
