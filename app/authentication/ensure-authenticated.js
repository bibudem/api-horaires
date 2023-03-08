import * as authorization from 'auth-header'
import config from 'config'

import hawk from './hawk.js'
import jwt from './jwt.js'
import console from '../lib/console.js'

/**
 * Ensure that a user is logged in before proceeding to next route middleware.
 *
 * This middleware ensures that a user is logged in.  If a request is received
 * that is unauthenticated, the request will be redirected to a login page (by
 * default to `/connexion`).
 *
 * Additionally, `returnTo` will be be set in the session to the URL of the
 * current request.  After authentication, this value can be used to redirect
 * the user to the page that was originally requested.
 *
 * Options:
 *   - `service`   URL to redirect to for login, defaults to _/connexion
 *   - `setReturnTo`  set redirectTo in session, defaults to _true_
 *
 * Examples:
 *
 *     app.get('/profile',
 *       ensureLoggedIn(),
 *       function(req, res) { ... });
 *
 *     app.get('/profile',
 *       ensureLoggedIn('/signin'),
 *       function(req, res) { ... });
 *
 *     app.get('/profile',
 *       ensureLoggedIn({ redirectTo: '/session/new', setReturnTo: false }),
 *       function(req, res) { ... });
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
export function ensureAuthenticated(options) {
  if (typeof options == 'string') {
    options = {
      service: options,
    }
  }
  options = options || {}

  var url = options.service || '/connexion'
  var setReturnTo = options.setReturnTo === undefined ? true : options.setReturnTo

  return function ensureAuthenticated(req, res, next) {
    if (!config.get('security.useAuth')) {
      return next()
    }

    if (!req.isAuthenticated || !req.isAuthenticated()) {
      console.debug('NOT logged in.')
      //console.debug('headers: ' + JSON.stringify(req.headers));
      if (req.get('authorization')) {
        // Try inline hawk authentication
        console.debug('request has Athorization header')
        const authHeader = authorization.parse(req.get('authorization'))
        if (authHeader.scheme.toLowerCase() === 'hawk') {
          console.debug('Hawk auth detected.')
          return hawk.ensureAuthenticated(req, res, next)
        }
        if (authHeader.scheme.toLowerCase() === 'bearer') {
          console.debug('bearer auth detected with jwt token.')
          return jwt.ensureAuthenticated(req, res, next)
        }
      }

      if (setReturnTo && req.session) {
        req.session.returnTo = req.originalUrl || req.url
      }
      console.debug('redirecting to (relative) ' + url)
      return res.redirect.relative(url)
    }
    console.debug('IS logged in.')
    next()
  }
}
