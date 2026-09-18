import config from 'config'

import { Strategy } from './passport-cas.js'
import console from '../lib/console.js'

const cas = {}
const ssoBaseURL = config.get('security.ssoBaseURL')
const appBaseURL = config.get('app.baseUrl')

cas.strategy = new Strategy(
  {
    version: 'CAS3.0',
    ssoBaseURL,
    appBaseURL,
  },
  // This is the `verify` callback
  function (user, done) {
    done(null, user)
  }
)

cas.ensureAuthenticated = function (req, res, next) {
  function authenticatedSuccess(err, user, info) {
    if (err) return next(err)
    if (!user) {
      console.warn('CAS authentication failed: ' + JSON.stringify(info))
      return res.status(401).send('Unauthorized')
    }
    if (!user.role) {
      console.warn('CAS user has no authorized role: ' + JSON.stringify(user))
      return res.status(403).send('Forbidden')
    }
    req.user = user
    next()
  }
  req._passport.instance.authenticate('cas', { session: true }, authenticatedSuccess)(req, res, next)
}

export default cas
