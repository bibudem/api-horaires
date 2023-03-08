import AnonymousStrategy from 'passport-anonymous'

import console from '../lib/console.js'

const anonymous = {}

anonymous.strategy = new AnonymousStrategy()

anonymous.ensureAuthenticated = function (req, res, next) {
  function authenticatedSuccess(user) {
    console.debug(`anonymous authenticated, user: ${arguments}`)
    req.user = req.user || {}
    req.user.role = 'client'
    next()
  }
  anonymous.passport.authenticate('anonymous', {
    session: false,
  })(req, res, authenticatedSuccess)
}

export default function (passport) {
  anonymous.passport = passport
  return anonymous
}
