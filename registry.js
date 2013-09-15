var couchwatch = require("couchwatch");
var events = require("events");

var registry = new events.EventEmitter();

couchwatch("http://isaacs.iriscouch.com/registry", -1).on("row", function (change) {
	registry.emit("change", change);
});

module.exports = registry;