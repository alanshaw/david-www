$ = jQuery

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
	# d3 dependency count graph
	###
	
	diameter = $('#dependency-counts-graph').width()
	format = d3.format(',d')
	
	bubble = d3.layout.pack().sort(null).size([diameter, diameter]).padding(1.5)
	
	svg = d3.select('#dependency-counts-graph').append('svg')
		.attr('width', diameter)
		.attr('height', diameter)
		.attr('class', 'bubble');
	
	d3.json 'dependency-counts.json', (error, data) ->
		
		# Get the max count
		max = 1
		
		for own depName of data
			max = data[depName] if data[depName] > max
		
		color = d3.scale.linear().domain([1, max]).range(['#f0f0f0', '#969696'])
		
		transformData = (data) ->
			array = for own depName of data
				depName: depName, value: data[depName]
			children: array
		
		node = svg.selectAll('.node')
			.data(
				bubble.nodes(transformData(data))
					.filter((d) -> !d.children)
					#.filter((d) -> d.value > 1)
			)
			.enter().append('g')
			.attr('class', 'node')
			.attr('transform', (d) -> "translate(#{d.x}, #{d.y})")
		
		node.append('title') 
			.text((d) -> d.depName + ': ' + format(d.value))
		
		node.append('circle')
			.attr('r', (d) -> d.r)
			.style('fill', (d) -> color(d.value))
			.on("click", (d) -> window.location = 'http://npmjs.org/package/' + d.depName)
		
		node.append('text')
			.attr('dy', '.3em')
			.style('text-anchor', 'middle')
			.text((d) -> d.depName.substring(0, d.r / 3))

########################################################################################################################
# Status page
########################################################################################################################

$('#status-page').each ->
	
	$('#status').fancybox()
	
	$('#badge-embed input').each ->
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
			
			loading = $ '<div class="loading"><i class="icon-spinner icon-spin icon-2x"></i> Reticulating splines...</div>'
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
			depSwitchers.first().addClass 'selected'
		else
			depInfoContainer.hide()
			devDepInfoContainer.fadeIn()
			depSwitchers.last().addClass 'selected'
			
			if not devDepInfoLoaded
				
				devDepInfoLoaded = true
				
				loading = $ '<div class="loading"><i class="icon-spinner icon-spin icon-2x"></i> Reticulating splines...</div>'
				
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
