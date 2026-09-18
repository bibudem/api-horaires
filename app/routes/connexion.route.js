import express from 'express'
import * as authorization from 'auth-header'
import config from 'config'
import jwt from 'jsonwebtoken'

import { createAbilities } from '../authorization/abilities.js'
import console from '../lib/console.js'

const connexionRoute = express.Router()

/*
 * Routes
 */

connexionRoute.get('/cas', function (req, res, next) {
  req._passport.instance.authenticate('cas', function (err, user, info) {
    if (err) {
      console.error(err)
      return res.status(401).redirect.relative(`${req.baseUrl}/unauthorized?code=auth_failed`)
    }
    if (!user) {
      console.warn(`CAS authentication rejected: ${JSON.stringify(info)}`)
      const friendlyErrors = {
        unauthorized_user: 'Votre compte n’est pas autorisé à utiliser cette application. Si vous pensez qu’il s’agit d’une erreur, contactez le service informatique de la bibliothèque.',
        unauthorized_group: 'Votre compte ne fait pas partie d’un groupe autorisé. Si vous pensez qu’il s’agit d’une erreur, contactez le service informatique de la bibliothèque.',
        auth_failed: 'L’authentification a échoué. Veuillez réessayer ou contacter le service informatique de la bibliothèque.',
      }
      const code = info && info.message ? info.message : 'unauthorized_user'
      const message = friendlyErrors[code] || friendlyErrors.unauthorized_user
      return res.redirect.relative(`${req.baseUrl}/unauthorized?code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}`)
    }
    req.logIn(user, function (err) {
      if (err) {
        console.error(err)
        return res.status(500).send({ error: 'Unable to log in user' })
      }

      let url = '/about'
      if (req.session && req.session.returnTo) {
        url = req.session.returnTo
        delete req.session.returnTo
      }
      if ('returnTo' in req.query) {
        url = req.query.returnTo
      }
      return res.redirect.relative(url)
    })
  })(req, res, next)
})

/*
 * passport-strategy-hawk
 */

connexionRoute.get('/hawk', (req, res, next) => {
  req._passport.instance.authenticate('hawk', {
    successReturnToOrRedirect: 'succes',
    failureRedirect: 'echec',
    session: false,
  })(req, res, next)
})

/*
 * JSON Web Token
 */

connexionRoute.get('/jwt', (req, res, next) => {
  req._passport.instance.authenticate('cas', function (err, userInfo) {
    if (err) {
      console.error(err)
      return res.send(err)
    }
    req.logIn(userInfo, function (err) {
      if (err) {
        console.error(err)
        return res.send(err)
      }
      const user = {
        login: req.user.login,
        rules: createAbilities(req.user).rules,
        role: req.user.role,
      }
      //
      console.debug('user: ', user)

      const token = jwt.sign(user, config.get('security.jwt.secretOrKey'), config.get('security.jwt.jsonWebTokenOptions'))
      //res.setHeader('Autorization', `Bearer ${token}`)

      req.session.jwt = token

      let url = '/about'
      if (req.session && req.session.returnTo) {
        url = req.session.returnTo
        delete req.session.returnTo
      }
      if ('returnTo' in req.query) {
        url = req.query.returnTo
      }

      // url = new URL(url, `${req.protocol}://${req.get('host')}${req.originalUrl}`)
      // url.searchParams.set('jwt', token)

      return res.redirect.relative(url)
    })
  })(req, res, next)
})

/*
 * Entry point for 'intelligent' guessing login method selection
 */

connexionRoute.get(/\/$/, (req, res, next) => {
  if (req.get('authorization')) {
    console.info('has authorization header')
    const authHeader = authorization.parse(req.get('authorization'))
    if (authHeader.scheme.toLowerCase() === 'hawk') {
      console.log(`redirecting to /hawk`)
      return res.redirect.relative(`./hawk`)
    }
    if (authHeader.scheme.toLowerCase() === 'bearer') {
      console.log(`redirecting to /jwt`)
      return res.redirect.relative(`./jwt`)
    }
  }
  console.log('no authorization header')
  // default authentication strategy
  console.log(`redirecting to ${req.baseUrl}/cas`)
  res.redirect.relative(`${req.baseUrl}/cas`)
})

const f = '<p><a href="../session">session</a></p><p><a href="../connexion">connexion</a></p><p><a href="../deconnexion">logout</a></p><p><a href="../admin">admin</a></p>'

connexionRoute.get('/succes', function (req, res) {
  console.log('/login success')
  // console.log(req.user);
  // console.log(req.session);
  console.log(req)
  res.send(f + '<p>login success</p><p>user: ' + req.user.login)
})

connexionRoute.get('/echec', function (req, res) {
  res.send(f + 'login failed')
})

connexionRoute.get('/unauthorized', function (req, res) {
  const code = req.query.code || 'unauthorized_user'
  const defaultMessages = {
    unauthorized_user: 'Votre compte n’est pas autorisé à utiliser cette application.',
    unauthorized_group: 'Votre compte ne fait pas partie d’un groupe autorisé.',
    auth_failed: 'L’authentification a échoué. Veuillez réessayer.',
  }
  const message = req.query.message || defaultMessages[code] || defaultMessages.unauthorized_user

  const html = `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Accès refusé</title>
        <style>
          body { font-family: sans-serif; background: #f6f7fb; color: #1f2937; display: grid; place-items: center; min-height: 100vh; margin: 0; }
          .card { max-width: 560px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); padding: 2rem; text-align: center; }
          h1 { color: #b91c1c; margin-top: 0; }
          p { line-height: 1.6; }
          a { color: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Accès refusé</h1>
          <p>${message}</p>
          <p>Si vous pensez qu’il s’agit d’une erreur, veuillez contacter le service informatique de la bibliothèque.</p>
          <p><a href="/connexion">Retour à la page de connexion</a></p>
        </div>
      </body>
    </html>
  `

  return res.status(403).type('html').send(html)
})

export default connexionRoute
