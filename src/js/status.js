/* jshint browser:true, jquery:true */

var d3 = require('d3');
var merge = require('merge');
var Handlebars = require('handlebars');
var fs = require('fs');
var cycle = require('cycle');
var david = require('./david');

require('./vendor/stackable');
require('./vendor/jquery.fancybox');
require('./vendor/jquery.ba-bbq');
require('./vendor/jquery.ba-hashchange');

$('#status-page').each(function () {
	var status = $('#status');
	status.fancybox();

	var devStatus = $('#dev-status');
	devStatus.fancybox();

	$('#badge-embed input, #dev-badge-embed input').each(function () {
		var clicked = false
			, embedCode = $(this);
		embedCode.click(function () {
			if (!clicked) {
				embedCode.select();
				clicked = true;
			}
		});
	});

	var state = {
			info: $.bbq.getState('info', true) || 'dependencies',
			view: $.bbq.getState('view', true) || 'table'
		};

	// Normalized pathname for use with XHR requests
	var pathname = window.location.pathname;

	if (pathname[pathname.length - 1] !== '/') {
		pathname += '/';
	}

	function initInfo (container, graphJsonUrl) {
		graphJsonUrl = graphJsonUrl || 'graph.json';

		$('.dep-table table', container).stacktable();

		/* d3 graph */

		function createNode (dep) {
			return {
				name: dep.name,
				version: dep.version,
				children: null
			};
		}

		/**
		 * Transform data from possibly cyclic structure into max 10 levels deep visual structure
		 */
		function transformData (rootDep, callback) {

			var transformsCount = 0
				, rootNode = createNode(rootDep);

			// Avoid 'too much recursion' errors
			function scheduleTransform (dep, node, level, maxLevel) {
				setTimeout(function () {
					transform(dep, node, level, maxLevel);
					transformsCount--;

					if (!transformsCount) {
						callback(rootNode);
					}
				}, 0);
			}

			function transform (dep, parentNode, level, maxLevel) {
				level = level || 0;
				maxLevel = maxLevel || 10;

				$.each(dep.deps, function(depName, depDep) {
					var node = createNode(depDep);

					if (level < maxLevel) {
						transformsCount++;
						scheduleTransform(depDep, node, level + 1, maxLevel);
					}

					if (!parentNode.children) {
						parentNode.children = [];
					}

					parentNode.children.push(node);
				});

				if (parentNode.children) {
					parentNode.children = parentNode.children.sort(function(a, b) {
						if (a.name < b.name) {
							return -1;
						} else if (a.name > b.name) {
							return 1;
						} else {
							return 0;
						}
					});
				}
			}

			transform(rootDep, rootNode);
		}

		var m = [20, 120, 20, 120]
			, w = parseInt($(window).width() - $('#main').position().left, 10) - m[1] - m[3]
			, h = 768 - m[0] - m[2]
			, i = 0
			, root = null
			, tree = d3.layout.tree().size([h, w])
			, diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x] });

		var vis = d3.select($('.dep-graph', container)[0]).append('svg:svg')
			.attr('width', w + m[1] + m[3])
			.attr('height', h + m[0] + m[2])
			.append('svg:g')
			.attr('transform', 'translate(' + m[3] + ',' + m[0] + ')');

		function update (source) {

			var duration = d3.event && d3.event.altKey ? 5000 : 500;

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse();

			// Normalize for fixed-depth.
			nodes.forEach(function(d) {
				d.y = d.depth * 180;
			});

			// Update the nodes...
			var node = vis.selectAll('g.node').data(nodes, function(d) {
					return d.id ? d.id : d.id = ++i;
				});

			// Enter any new nodes at the parent's previous position.
			var nodeEnter = node.enter().append('svg:g').attr('class', 'node').attr('transform', function () {
					return 'translate(' + source.y0 + ',' + source.x0 + ')';
				}).on('click', function(d) {
					toggle(d);
					update(d);
				});

			nodeEnter.append('svg:circle').attr('r', 0.000001).style('fill', function(d) {
				return d._children ? '#ccc' : '#fff';
			});

			nodeEnter.append('svg:text').attr('x', function(d) {
				return d.children || d._children ? -10 : 10;
			}).attr('dy', '.25em').attr('text-anchor', function(d) {
				return d.children || d._children ? 'end' : 'start';
			}).text(function(d) {
				return d.name + ' ' + d.version;
			}).style('fill-opacity', 0.000001);

			// Transition nodes to their new position.
			var nodeUpdate = node.transition().duration(duration).attr('transform', function(d) {
					return 'translate(' + d.y + ',' + d.x + ')';
				});

			nodeUpdate.select('circle').attr('r', 4.5).style('fill', function(d) {
				return d._children ? '#ccc' : '#fff';
			});

			nodeUpdate.select('text').style('fill-opacity', 1);
			var nodeExit = node.exit().transition().duration(duration).attr('transform', function () {
					return 'translate(' + source.y + ',' + source.x + ')';
				}).remove();

			// Transition exiting nodes to the parent's new position.
			nodeExit.select('circle').attr('r', 0.000001);

			nodeExit.select('text').style('fill-opacity', 0.000001);

			// Update the links...
			var link = vis.selectAll('path.link').data(tree.links(nodes), function(d) {
					return d.target.id;
				});

			// Enter any new links at the parent's previous position.
			link.enter().insert('svg:path', 'g').attr('class', 'link').attr('d', function () {
				var o = {
						x: source.x0,
						y: source.y0
					};
				return diagonal({
					source: o,
					target: o
				});
			}).transition().duration(duration).attr('d', diagonal);

			// Transition links to their new position.
			link.transition().duration(duration).attr('d', diagonal);

			// Transition exiting nodes to the parent's new position.
			link.exit().transition().duration(duration).attr('d', function () {
				var o = {
						x: source.x,
						y: source.y
					};
				return diagonal({
					source: o,
					target: o
				});
			}).remove();

			// Stash the old positions for transition.
			nodes.forEach(function(d) {
				d.x0 = d.x;
				d.y0 = d.y;
			});
		}

		// Toggle children.
		function toggle (d) {
			if (d.children) {
				d._children = d.children;
				d.children = null;
			} else {
				d.children = d._children;
				d._children = null;
			}
		}

		// Load the graph data and render when change view
		var graphLoaded = false
			, graphContainer = $('.dep-graph', container)
			, tableContainer = $('.dep-table', container);

		graphContainer.hide();

		function initGraph () {

			var loading = david.createLoadingEl();
			graphContainer.prepend(loading);

			d3.json(pathname + graphJsonUrl, function(er, json) {

				if (er) {
					return loading.empty().text('Error occurred retrieving graph data');
				}

				transformData(cycle.retrocycle(json), function(node) {
					root = node;
					root.x0 = h / 2;
					root.y0 = 0;

					function toggleAll (d) {
						if (d.children) {
							d.children.forEach(toggleAll);
							toggle(d);
						}
					}

					// Initialize the display to show a few nodes.
					root.children.forEach(toggleAll);
					update(root);
					loading.remove();
				});
			});
		}

		var viewSwitchers = $('.switch a', container);

		viewSwitchers.click(function(event) {
			event.preventDefault();
			merge(state, $.deparam.fragment($(this).attr('href')));
			$.bbq.pushState(state);
		});

		function onHashChange () {
			merge(state, $.bbq.getState());

			viewSwitchers.removeClass('selected');

			if (state.view !== 'tree') {
				graphContainer.hide();
				tableContainer.fadeIn();
				viewSwitchers.first().addClass('selected');
			} else {
				tableContainer.hide();
				graphContainer.fadeIn();
				viewSwitchers.last().addClass('selected');

				if (!graphLoaded) {
					graphLoaded = true;
					initGraph();
				}
			}
		}

		/* Init changes links */

		$('.changes', container).click(function(event) {
			event.preventDefault();
			var row = $(this).closest('tr'),
				container = $('<div class="changes-popup"/>').append(david.createLoadingEl());

			var name, from, to;

			if (row.closest('table').is('.stacktable')) {
				name = $('a:first-child', row).text();
				from = $('.st-val', row.next()).text();
				to = $('.st-val', row.next().next()).text();
			} else {
				name = $('.dep a:first-child', row).text();
				from = $('.required', row).text();
				to = $('.stable', row).text();
			}

			$.fancybox.open(container);

			$.ajax({
				url: '/package/' + name + '/changes.json',
				dataType: 'json',
				data: {from: from, to: to},
				success: function(data) {
					data.from = from;
					data.to = to;

					var tpl = fs.readFileSync(__dirname + '/../../dist/inc/changes.html');
					container.html(Handlebars.compile(tpl)(data));
					$.fancybox.update();
				},
				error: function () {
					container.html(fs.readFileSync(__dirname + '/../../dist/inc/changelog-er.html'));
					$.fancybox.update();
				}
			});
		});

		$(window).bind('hashchange', onHashChange);

		onHashChange();
	}

	var devDepInfoLoaded = false
		, depInfoContainer = $('#dep-info')
		, devDepInfoContainer = $('#dev-dep-info');

	devDepInfoContainer.hide();

	var depSwitchers = $('#dep-switch a');

	depSwitchers.click(function(event) {
		event.preventDefault();
		merge(state, $.deparam.fragment($(this).attr('href')));
		$.bbq.pushState(state);
	});

	// Hash change for info switch
	function onHashChange () {

		merge(state, $.bbq.getState());

		depSwitchers.removeClass('selected');

		if (state.info !== 'devDependencies') {
			devDepInfoContainer.hide();
			depInfoContainer.fadeIn();
			status.show();
			devStatus.hide();
			depSwitchers.first().addClass('selected');
		} else {
			depInfoContainer.hide();
			devDepInfoContainer.fadeIn();
			status.hide();
			devStatus.show();
			depSwitchers.last().addClass('selected');

			if (!devDepInfoLoaded) {

				devDepInfoLoaded = true;

				var loading = david.createLoadingEl();

				devDepInfoContainer.prepend(loading);

				$.getJSON(pathname + 'dev-info.json', function(data) {
					var tpl = fs.readFileSync(__dirname + '/../../dist/inc/info.html');
					loading.remove();
					devDepInfoContainer.html(Handlebars.compile(tpl)({ info: data }));
					initInfo(devDepInfoContainer, 'dev-graph.json');
				});
			}
		}
	}

	$(window).bind('hashchange', onHashChange);

	onHashChange();
	initInfo(depInfoContainer);
});
