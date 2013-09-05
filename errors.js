/**
 * errors.js
 * =========
 *
 * What to do when you stray from the happy path?
 *
 * ## Conceivable errors:
 *
 * User
 *
 * - No such repository:
 *   - Check for / separator in request path:
 *     - You haven't typed username/repo correctly
 *     - You are trying to access a page, like /stats, that doesn't exist.
 * - No package.json in repository: "Error: 404 Failed to retrieve manifest"
 * - Private repository: TODO: Do we get a 403 we can use?
 * - Invalid package.json: TODO
 *
 * Server
 *
 * - Too many requests: TODO: toobusy AKA: Don't melt: https://hacks.mozilla.org/2013/01/building-a-node-js-server-that-wont-melt-a-node-js-holiday-season-part-5)
 * - David is dead. Not traditionally the departed's responsibility.
 *
 * ## Inconceivable errors:
 *
 *   "You keep using this word. I do not think it means what you think it means"
 *
 */

var util = require('util');

/**
 * Default error handler, for when you don't know better.
 * Sets the status and renders the 500.html
 *
 * TODO: Pick apart the errors as outlined above and give the user better feedback.
 *
 * Usage:
 * if (errors.happened(err, req, res)) { return }
 *
 * @param err {Object | String | Error}
 * @param req
 * @param res
 * @param msg {String} Additional message to display to the user
 * @return {Boolean}
 */
module.exports.happened = function(err, req, res, msg) {

	if (!err) { return false; }

	console.log(msg, err);

	if (util.isError(err)) {
		console.log(err.stack);
	}

	res.status(500).render(500, {err: msg});

	return true;
};
