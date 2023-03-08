import config from 'config'
import passport from 'passport'
import session from 'express-session'
import memoryStore from 'memorystore'
import { initialize, ensureAuthenticated } from '../authentication/index.js'
import redirectRelative from '../lib/redirect-relative.js'

export function useAuth(app) {
  if (config.get('security.useAuth')) {
    const MemoryStore = memoryStore(session)

    app.use(
      session({
        ...config.get('app.sessionOptions'),
        store: new MemoryStore({
          checkPeriod: 86400000, // prune expired entries every 24h
        }),
      })
    )
    app.use(passport.initialize())
    app.use(passport.session())

    initialize(passport)

    app.ensureAuthenticated = ensureAuthenticated

    app.use(redirectRelative())
  } else {
    app.ensureAuthenticated = () => {}
  }
}
