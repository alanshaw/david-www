$ = jQuery

# Do this on the homepage only
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