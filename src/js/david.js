/* jshint browser:true */

var $ = require('jquery-browserify');
var d3 = require('d3');

var david = {};

/* d3 dependency count graph */
$('#dependency-counts-graph').each(function () {

	var diameter = $(this).width()
		, format = d3.format(',d')
		, bubble = d3.layout.pack().sort(null).size([
			diameter,
			diameter
		]).padding(1.5);

	var svg = d3.select(this).append('svg')
		.attr('width', diameter)
		.attr('height', diameter)
		.attr('class', 'bubble');

	david.renderDependencyCountsGraph = function (data) {
		// Get the max count
		var max = Object.keys(data).reduce(function (max, depName) {
				return data[depName] > max ? data[depName] : max;
			}, 1);

		var color = d3.scale.linear().domain([
				1,
				max
			]).range([
				'#b8e3f3',
				'#30aedc'
			]);

		function transformData(data) {
			return {
				children: Object.keys(data).map(function (depName) {
					return {
						depName: depName,
						value: data[depName]
					};
				})
			};
		}

		var nodes = svg.selectAll('.node').data(bubble.nodes(transformData(data)).filter(function (d) {
				return !d.children;
			}), function (d) {
				return d.depName;
			});

		var nodeEnter = nodes.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', function () {
				return 'translate(' + diameter / 2 + ',' + diameter / 2 + ')';
			}).on('click', function (d) {
				window.location = 'http://npmjs.org/package/' + d.depName;
			});

		nodeEnter.append('title').text(function (d) {
			return d.depName + ': ' + format(d.value);
		});

		nodeEnter.append('circle');

		nodeEnter.append('text')
			.attr('dy', '.3em')
			.style('text-anchor', 'middle');

		var nodeUpdate = nodes.transition().attr('transform', function (d) {
				return 'translate(' + d.x + ',' + d.y + ')';
			});

		nodeUpdate.select('circle').attr('r', function (d) {
			return d.r;
		}).style('fill', function (d) {
			return color(d.value);
		});

		nodeUpdate.select('text').text(function (d) {
			return d.depName.substring(0, d.r / 3);
		});

		nodes.exit().transition().remove().select('circle').attr('r', 0);
	};
});

david.createLoadingEl = function (text) {
	return $('<div class="loading"><i class="icon-spinner icon-spin icon-2x"></i>' + (text || ' Reticulating splines...') + '</div>');
};

module.exports = david;