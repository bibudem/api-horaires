'use strict';

import {
	Strategy,
	ExtractJwt
} from 'passport-jwt';
import {
	getRoleFor
} from '../authorization/abilities';
const User = require('../models/User');
const originalUrl = require('original-url');

import config from 'config'
import console from '../lib/console'

const jwt = {};

const jwtOptions = {
	...config.get('security.jwt'),
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
}

jwt.strategy = new Strategy(jwtOptions, function verifyCallback(jwtPayload, done) {
	console.log(`[begin] id: ${jwtPayload.sub}`);
	const user = new User(jwtPayload.sub);
	console.log(`user: ${JSON.stringify(user)}`);
	const role = getRoleFor(user, true);
	console.log(`role: ${role}`);
	user.role = role || 'client';
	console.log('role is: ' + user.role);
	done(null, {
		user
	});
});

jwt.ensureAuthenticated = function (req, res, next) {
	console.debug('[ensureAuthenticated]');
	console.debug(`req.user: ${JSON.stringify(req.user)}`)

	function authenticatedSuccess(user) {
		console.log(user);
		//console.log(user.output.payload)
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


	// console.log(`originalURL: ${JSON.stringify(originalUrl(req))}`)
	// console.log(`req.originalUrl (after): ${req.originalUrl}`)
	req._passport.instance.authenticate('jwt', opts)(req, res, authenticatedSuccess);
}

export default jwt;