import express from 'express'
import ViteExpress from 'vite-express'
import { engine } from 'express-handlebars'
import cors from 'cors'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import webLogger from '@remillc/web-logger'
import config from 'config'
import adminRoute from './routes/admin.route.js'
import apiRoutes from './routes/api.route.js'
import importRoute from './routes/import.route.js'
import assetsRoute from './routes/assets.route.js'

const app = express()

const mode = process.env.NODE_ENV.endsWith('production') ? 'production' : 'development'
ViteExpress.config({ mode })

/*
 * App configs
 */

app.set('port', config.get('app.port'))
app.disable('x-powered-by')
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    helpers: {
      ifEquals(arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this)
      },
    },
  })
)
app.set('view engine', 'hbs')
app.set('views', './app/views')
app.locals.basePath = (url => (url.pathname === '/' ? '' : url.pathname))(new URL(config.get('app.baseUrl')))
app.locals.mode = mode

/*
 * Middlewares
 */

app.use(bodyParser.json())
app.use(
  webLogger({
    logDirectory: config.get('log.dir'),
  })
)

/*
 * Admin UI
 */

app.use(/^\/admin$/, function (req, res, next) {
  res.redirect(config.get('app.baseUrl') + '/admin/')
})

app.use(
  '/admin/' /*, auth.ensureAuthenticated({
  service: '/connexion/cas'
})*/,
  adminRoute
)

// app.use('/connexion', connexionRoute)

/*
 * Static assets
 */

if (process.env.NODE_ENV.endsWith('production')) {
  app.use('/assets', assetsRoute)
}

/*
 * API routes
 */

app.use('/import', importRoute)

app.use(cors(), apiRoutes)

/**
 * Start Express server.
 */

if (process.env.NODE_ENV.endsWith('production')) {
  app.listen(app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'))
  })
} else {
  ViteExpress.listen(app, app.get('port'), () => {
    console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'))
  })
}
