'use strict';

const cas = require('./cas');
const hawk = require('./hawk');
import jwt from './jwt'

module.exports = function initialize(passport) {
	passport.use('cas', cas.strategy);
	passport.use('hawk', hawk.strategy);
	passport.use('jwt', jwt.strategy)

	// Configure Passport authenticated session persistence.
	//
	// In order to restore authentication state across HTTP requests, Passport needs
	// to serialize users into and deserialize users out of the session.  The
	// typical implementation of this is as simple as supplying the user ID when
	// serializing, and querying the user record by ID from the database when
	// deserializing.
	passport.serializeUser(function (user, done) {
		//console.log(`[serializeUser] user: ${JSON.stringify(user)}`);
		done(null, user);
	});

	passport.deserializeUser(function (obj, done) {
		//console.log(`[deserializeUser] obj: ${JSON.stringify(obj)}`);
		//console.log('deserializeUser');
		done(null, obj);
	});
}