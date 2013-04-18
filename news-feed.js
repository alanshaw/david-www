var request = require('request');
var moment = require('moment');

function NewsRss(xml) {
	this.xml = xml;
	this.expires = moment().add(NewsRss.TTL);
}

NewsRss.TTL = moment.duration({days: 1});

var news;

module.exports.get = function(callback) {
	
	if(news && news.expires > new Date()) {
		callback(null, news.xml);
		return;
	}
	
	request('http://davidiswatching.tumblr.com/rss', function(err, res, xml) {
		
		if(err) {
			callback(err);
			return;
		}
		
		if(res.statusCode != 200) {
			callback(new Error('Unexpected status requesting news feed' + res.statusCode));
			return;
		}
		
		news = new NewsRss(xml);
		
		callback(null, news.xml);
	});
};