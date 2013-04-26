$ = jQuery

########################################################################################################################
# Shared
########################################################################################################################

###
# d3 dependency count graph
###

dependencyCounts = {}
renderDependencyCountsGraph = null

$('#dependency-counts-graph').each ->
	
	diameter = $(@).width()
	format = d3.format(',d')
	
	bubble = d3.layout.pack().sort(null).size([diameter, diameter]).padding(1.5)
	
	svg = d3.select(@).append('svg')
		.attr('width', diameter)
		.attr('height', diameter)
		.attr('class', 'bubble');
	
	# Get the dependency counts
	d3.json 'dependency-counts.json', (error, data) ->
		dependencyCounts = data
		renderDependencyCountsGraph data
	
	# Render the graph
	renderDependencyCountsGraph = (data) ->
		
		# Get the max count
		max = 1
		
		for own depName of data
			max = data[depName] if data[depName] > max
		
		color = d3.scale.linear().domain([1, max]).range(['#b8e3f3', '#30aedc'])
		
		transformData = (data) ->
			array = for own depName of data
				depName: depName, value: data[depName]
			children: array
		
		nodes = svg.selectAll('.node').data(
			bubble.nodes(transformData(data)).filter((d) -> !d.children)
			(d) -> d.depName
		)
		
		nodeEnter = nodes.enter()
			.append('g')
			.attr('class', 'node')
			.attr('transform', -> "translate(#{diameter / 2}, #{diameter / 2})")
			.on("click", (d) -> window.location = 'http://npmjs.org/package/' + d.depName)
		
		nodeEnter.append('title') 
			.text((d) -> d.depName + ': ' + format(d.value))
		
		nodeEnter.append('circle')
		
		nodeEnter.append('text')
			.attr('dy', '.3em')
			.style('text-anchor', 'middle')
		
		nodeUpdate = nodes.transition().attr('transform', (d) -> "translate(#{d.x}, #{d.y})")
		
		nodeUpdate.select('circle')
			.attr('r', (d) -> d.r)
			.style('fill', (d) -> color(d.value))
		
		nodeUpdate.select('text')
			.text((d) -> d.depName.substring(0, d.r / 3))
		
		nodes.exit().transition().remove().select('circle').attr('r', 0)

createLoadingEl = (text = ' Reticulating splines...') -> $ '<div class="loading"><i class="icon-spinner icon-spin icon-2x"></i>' + text + '</div>'

########################################################################################################################
# Homepage
########################################################################################################################

$('#home-page').each ->
	
	url = $ '.badge-maker span'
	badge = $ '.badge-maker img'
	
	# Update the image when the user changes the url
	url.on('input', -> badge.attr('src', "#{url.text()}.png"))
	
	# Red text if the url isn't good for it.
	badge.error ->
		url.addClass 'nope'
		$(@).hide()
	
	# Green text if it is... wait a minute should this be tied to repo health not.
	badge.load ->
		if $(@).attr('src') is '/img/outofdate.png' then return # bail, it's the placeholder image load.
		url.removeClass 'nope'
		$(@).show()
	
	###
	# RSS feed
	###
	$.getFeed
		url: '/news/rss.xml'
		success: (feed) -> 
			
			entry = feed.items[0]
			entry.shortDesc = $('<div/>').html(entry.description).text().substr(0, 200)
			entry.datetime = moment(entry.updated).format()
			entry.formattedDate = moment(entry.updated).format('MMMM Do YYYY, HH:mm')
			
			$.get('/inc/news.html', (template) -> $('#stats').append(Handlebars.compile(template)(entry)))

########################################################################################################################
# Status page
########################################################################################################################

$('#status-page').each ->
	
	status = $('#status')
	status.fancybox()
	
	devStatus = $('#dev-status')
	devStatus.fancybox()
	
	$('#badge-embed input, #dev-badge-embed input').each ->
		clicked = false
		$(@).click -> 
			if not clicked 
				$(@).select()
				clicked = true
	
	state = 
		info: $.bbq.getState('info', true) || 'dependencies'
		view: $.bbq.getState('view', true) || 'table'
	
	# Normalized pathname for use with XHR requests
	pathname = window.location.pathname
	pathname += '/' if pathname[pathname.length - 1] isnt '/'
	
	initInfo = (container, graphJsonUrl = 'graph.json') ->
		
		$('.dep-table table', container).stacktable()
		
		###
		# d3 graph
		###
		
		createNode = (dep) ->
			name: dep.name
			version: dep.version
			children: null
		
		# Transform data from possibly cyclic structure into max 10 levels deep visual structure
		transformData = (rootDep, callback) ->
			
			transformsCount = 0
			
			rootNode = createNode(rootDep)
			
			scheduleTransform = (dep, node, level, maxLevel) ->
				
				setTimeout(
					->
						transform(dep, node, level, maxLevel)
						
						transformsCount--
						
						callback(rootNode) if transformsCount is 0
					0
				)
			
			transform = (dep, parentNode, level = 0, maxLevel = 10) ->
				
				$.each dep.deps, (depName, depDep) ->
					
					node = createNode(depDep)
					
					if level < maxLevel
						
						transformsCount++
						
						scheduleTransform(depDep, node, level + 1, maxLevel)
					
					parentNode.children = [] if not parentNode.children
					parentNode.children.push node
				
				if parentNode.children?
					parentNode.children = parentNode.children.sort (a, b) -> if a.name < b.name then -1 else if a.name > b.name then 1 else 0
			
			transform(rootDep, rootNode)
		
		m = [20, 120, 20, 120]
		#w = 1024 - m[1] - m[3]
		w = parseInt($(window).width() - $('#main').position().left) - m[1] - m[3]
		h = 768 - m[0] - m[2]
		i = 0
		root = null
		
		tree = d3.layout.tree().size [h, w] 
		
		diagonal = d3.svg.diagonal().projection (d) -> [d.y, d.x]
		
		vis = d3.select($('.dep-graph', container)[0]).append("svg:svg")
			.attr("width", w + m[1] + m[3])
			.attr("height", h + m[0] + m[2])
			.append("svg:g")
			.attr("transform", "translate(" + m[3] + "," + m[0] + ")")
		
		update = (source) ->
			
			duration = if d3.event && d3.event.altKey then 5000 else 500
			
			# Compute the new tree layout.
			nodes = tree.nodes(root).reverse()
			
			# Normalize for fixed-depth.
			(d.y = d.depth * 180) for d in nodes
			
			# Update the nodes...
			node = vis.selectAll("g.node").data(nodes, (d) -> d.id or (d.id = ++i))
			
			# Enter any new nodes at the parent's previous position.
			nodeEnter = node.enter().append("svg:g")
				.attr("class", "node")
				.attr("transform", -> "translate(#{source.y0}, #{source.x0})")
				.on("click", (d) -> toggle d; update d)
			
			nodeEnter.append("svg:circle")
				.attr("r", 1e-6)
				.style("fill", (d) -> if d._children then "#ccc" else "#fff")
			
			nodeEnter.append("svg:text")
				.attr("x", (d) -> if d.children or d._children then -10 else 10)
				.attr("dy", ".25em")
				.attr("text-anchor", (d) -> if d.children or d._children then "end" else "start")
				.text((d) -> d.name + ' ' + d.version)
				.style("fill-opacity", 1e-6)
			
			# Transition nodes to their new position.
			nodeUpdate = node.transition()
				.duration(duration)
				.attr("transform", (d) -> "translate(#{d.y}, #{d.x})")
			
			nodeUpdate.select("circle")
				.attr("r", 4.5)
				.style("fill", (d) -> if d._children then "#ccc" else "#fff")
			
			nodeUpdate.select("text")
				.style("fill-opacity", 1)
			
			# Transition exiting nodes to the parent's new position.
			nodeExit = node.exit().transition()
				.duration(duration)
				.attr("transform", -> "translate(#{source.y}, #{source.x})")
				.remove()
			
			nodeExit.select("circle")
				.attr("r", 1e-6)
			
			nodeExit.select("text")
				.style("fill-opacity", 1e-6)
			
			# Update the links…
			link = vis.selectAll("path.link").data(tree.links(nodes), (d) -> d.target.id)
			
			# Enter any new links at the parent's previous position.
			link.enter().insert("svg:path", "g")
				.attr("class", "link")
				.attr("d", ->
					o = x: source.x0, y: source.y0
					diagonal(source: o, target: o)
				).transition()
				.duration(duration)
				.attr("d", diagonal)
			
			# Transition links to their new position.
			link.transition()
				.duration(duration)
				.attr("d", diagonal)
			
			# Transition exiting nodes to the parent's new position.
			link.exit().transition()
				.duration(duration)
				.attr("d", ->
					o = x: source.x, y: source.y
					diagonal(source: o, target: o)
				).remove()
			
			# Stash the old positions for transition.
			for d in nodes
				d.x0 = d.x
				d.y0 = d.y
			
			return
		
		# Toggle children.
		toggle = (d) ->
			
			if d.children
				d._children = d.children
				d.children = null
			else
				d.children = d._children
				d._children = null
		
		# Load the graph data and render when change view
		
		graphLoaded = false
		
		graphContainer = $('.dep-graph', container)
		tableContainer = $('.dep-table', container)
		
		graphContainer.hide()
		
		initGraph = ->
			
			loading = createLoadingEl()
			graphContainer.prepend(loading)
			
			d3.json pathname + graphJsonUrl, (err, json) ->
				
				if err? then loading.empty().text('Error occurred retrieving graph data')
				
				transformData(
					JSON.retrocycle(json)
					(node) ->
						root = node
						root.x0 = h / 2
						root.y0 = 0
						
						toggleAll = (d) ->
							if d.children
								toggleAll child for child in d.children
								toggle d
						
						# Initialize the display to show a few nodes.
						toggleAll child for child in root.children
						update root
						loading.remove()
				)
		
		viewSwitchers = $('.switch a', container)
		
		viewSwitchers.click (event) ->
			event.preventDefault()
			
			_.merge state, $.deparam.fragment $(@).attr('href')
			
			$.bbq.pushState state
		
		onHashChange = ->
			
			_.merge state, $.bbq.getState()
			
			viewSwitchers.removeClass 'selected'
			
			if state.view isnt 'tree'
				graphContainer.hide()
				tableContainer.fadeIn()
				viewSwitchers.first().addClass 'selected'
			else
				tableContainer.hide()
				graphContainer.fadeIn()
				viewSwitchers.last().addClass 'selected'
				
				if not graphLoaded
					graphLoaded = true
					initGraph()
		
		$(window).bind 'hashchange', onHashChange
		
		onHashChange()
	
	devDepInfoLoaded = false
	
	depInfoContainer = $('#dep-info')
	devDepInfoContainer = $('#dev-dep-info')
	
	devDepInfoContainer.hide()
	
	depSwitchers = $('#dep-switch a')
	
	depSwitchers.click (event) ->
		event.preventDefault()
		
		_.merge state, $.deparam.fragment $(@).attr('href')
		
		$.bbq.pushState state
	
	# Hash change for info switch
	onHashChange = ->
		
		_.merge state, $.bbq.getState()
		
		depSwitchers.removeClass 'selected'
		
		if state.info isnt 'devDependencies'
			devDepInfoContainer.hide()
			depInfoContainer.fadeIn()
			status.show()
			devStatus.hide()
			depSwitchers.first().addClass 'selected'
		else
			depInfoContainer.hide()
			devDepInfoContainer.fadeIn()
			status.hide();
			devStatus.show();
			depSwitchers.last().addClass 'selected'
			
			if not devDepInfoLoaded
				
				devDepInfoLoaded = true
				
				loading = createLoadingEl()
				
				devDepInfoContainer.prepend(loading)
				
				$.getJSON(pathname + 'dev-info.json', (data) ->
					$.get('/inc/info.html', (template) ->
						loading.remove()
						devDepInfoContainer.html(Handlebars.compile(template)(info: data))
						initInfo devDepInfoContainer, 'dev-graph.json'
					)
				)
	
	$(window).bind 'hashchange', onHashChange
	
	onHashChange()
	initInfo depInfoContainer

########################################################################################################################
# Search page
########################################################################################################################

$('#search-page').each ->
	
	searchForm = $ 'form'
	
	searchField = $ 'input', searchForm
	
	searchTimeoutId = null
	
	search = (q) -> 
		
		data = {}
		
		searchForm.append(createLoadingEl(' Searching...')) if $('.loading', searchForm).length is 0
		
		renderDependencyCountsGraph {}
		
		$.getJSON(
			'/search.json'
			q: q
			(results) ->
				
				$('.loading', searchForm).remove()
				
				if Object.keys(results).length is 0
					data = dependencyCounts
				else
					
					for own pkgName of results
						data[pkgName] = results[pkgName].count + 1
				
				renderDependencyCountsGraph data
		)
	
	searchField.keyup ->
		
		clearTimeout searchTimeoutId
		
		q = searchField.val()
		
		if q.length is 0
			
			renderDependencyCountsGraph(dependencyCounts)
			
		else if q.length > 2
			
			searchTimeoutId = setTimeout(
				-> search q
				1000
			)
	
	if searchField.val()
		renderDependencyCountsGraph {}
		search searchField.val() 