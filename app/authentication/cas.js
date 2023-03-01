import { Strategy } from './passport-cas'
import { getRoleForGroup } from '../authorization/abilities';

import config from 'config'
import console from '../lib/console'

const cas = {};

cas.strategy = new Strategy({
	version: 'CAS3.0',
	ssoBaseURL: 'https://identification.umontreal.ca/cas',
	serverBaseURL: config.get('app.baseUrl')
},
	// This is the `verify` callback
	function (user, done) {
		done(null, user);
	}
);

cas.ensureAuthenticated = function (req, res, next) {
	function authenticatedSuccess(user) {
		console.debug(`cas authenticated, user: ${arguments}`);
		req.user = req.user || {};
		//req.user.role = 'client';
		req.user.role = getRoleForGroup(user);
		next()
	}
	req._passport.instance.authenticate('cas')(req, res, authenticatedSuccess);
}

module.exports = cas;