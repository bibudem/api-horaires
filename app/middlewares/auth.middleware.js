import config from 'config'
import passport from 'passport'
import session from 'express-session'
import { initialize, ensureAuthenticated } from '../authentication/index.js'
import { createAbilities } from '../authorization/abilities.js'
import redirectRelative from '../lib/redirect-relative.js'

export function useAuth(app) {
  if (config.get('security.useAuth')) {
    app.use(session(config.get('app.sessionOptions')))
    app.use(passport.initialize())
    app.use(passport.session())

    initialize(passport)

    app.ensureAuthenticated = ensureAuthenticated

    app.use((req, res, next) => {
      req.ensureAuthenticated = ensureAuthenticated
      req.createAbilities = createAbilities
      next()
    })

    app.use(redirectRelative())
  }
}
