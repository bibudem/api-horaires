import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import webLogger from '@remillc/web-logger'
import config from 'config'
import adminRoute from './routes/admin.route.js'
import apiRoutes from './routes/api.route.js'
import importRoute from './routes/import.route.js'

const app = express();

app.set('port', config.get('app.port'))
app.disable('x-powered-by');

/*
 * Middlewares
 */

app.use(cors());
app.use(bodyParser.json());
app.use(webLogger({
  logDirectory: config.get('log.dir')
}));

/*
 * Admin UI
 */

app.use(/^\/admin$/, function (req, res, next) {
  res.redirect(config.get('app.baseUrl') + '/admin/')
})

app.use('/admin/'/*, auth.ensureAuthenticated({
  service: '/connexion/cas'
})*/, adminRoute)

// app.use('/connexion', connexionRoute)

/*
 * API routes
 */

app.use('/import', importRoute)

app.use(apiRoutes)

/**
 * Start Express server.
 */

app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
});
