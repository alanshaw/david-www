var rewire = require('rewire');
var registry = rewire('../registry');

module.exports = {
	'Error event from couchwatch should not exit process': function (test) {
		var watcher = registry.__get__('watcher');
		watcher.emit('error', new Error('Mock error from couchwatch'));
		// If the error is not caught, the process will exit and the test will never be done
		test.done();
	}
};