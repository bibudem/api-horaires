'use strict';

const AnonymousStrategy = require('passport-anonymous');

import console from '../lib/console'

const anonymous = {};

anonymous.strategy = new AnonymousStrategy();

anonymous.ensureAuthenticated = function (req, res, next) {
	function authenticatedSuccess(user) {
		console.debug(`anonymous authenticated, user: ${arguments}`)
		req.user = req.user || {};
		req.user.role = 'client';
		next()
	}
	anonymous.passport.authenticate('anonymous', {
		session: false
	})(req, res, authenticatedSuccess);
}

module.exports = function (passport) {
	anonymous.passport = passport;
	return anonymous;
};