import HawkStrategy from 'passport-hawk'
import config from 'config'

import { getRoleFor } from '../authorization/abilities.js'
import User from '../models/User'
const originalUrl = require('original-url')

import console from '../lib/console.js'

const hawk = {};

hawk.strategy = new HawkStrategy(function verifyCallback(id, done) {
	console.debug(`[begin] id: ${id}`);
	const user = new User(id);
	console.debug(`user: ${JSON.stringify(user)}`);
	const role = getRoleFor(user, true);
	console.debug(`role: ${role}`);
	user.role = role || 'client';
	console.debug('role is: ' + user.role);
	done(null, {
		key: config.get('security.hawk.key'),
		algorithm: 'sha256',
		user: user
	});
});

hawk.ensureAuthenticated = function (req, res, next) {
	console.debug('[ensureAuthenticated]');
	console.debug(`req.user: ${JSON.stringify(req.user)}`)

	function authenticatedSuccess(user) {
		console.debug(user);
		//console.debug(user.output.payload)
		next();
	}

	// Patch temporaire. Retirer quand le serveur reverse proxy retournera l'en-tête 'x-formarded-proto' ou 'forwarded'

	const opts = {
		session: false
	};

	if ('x-forwarded-host' in req.headers) {
		req.originalUrl = config.get('app.mountPath') + req.originalUrl;
		if (!('x-forwarded-proto' in req.headers)) {
			req.headers['x-forwarded-proto'] = 'https';
		}

		const url = originalUrl(req);
		req.headers['x-my-hostname'] = url.hostname + ':443';
		opts.hostHeaderName = 'x-my-hostname';
	}


	// console.debug(`originalURL: ${JSON.stringify(originalUrl(req))}`)
	// console.debug(`req.originalUrl (after): ${req.originalUrl}`)
	req._passport.instance.authenticate('hawk', opts)(req, res, authenticatedSuccess);
}

module.exports = hawk;