import express from 'express'
import * as authorization from 'auth-header'
import config from 'config'
import jwt from 'jsonwebtoken'
import console from '../lib/console'

const connexionRouter = express.Router();


/*
 * Routes
 */

connexionRouter.get('/cas', function (req, res, next) {
  req._passport.instance.authenticate('cas', function (err, user, info) {
    if (err) {
      console.error(err);
      return res.send(err)
    }
    req.logIn(user, function (err) {
      if (err) {
        console.error(err);
        return res.send(err);
      }

      let url = '/about';
      //const url = 'success';
      if (req.session && req.session.returnTo) {
        url = req.session.returnTo;
        delete req.session.returnTo;
      }
      if ('returnTo' in req.query) {
        url = req.query.returnTo;
      }
      return res.redirect.relative(url);
    });

  })(req, res, next)
});

/*
 * passport-strategy-hawk
 */

connexionRouter.get('/hawk', (req, res, next) => {
  req._passport.instance.authenticate('hawk', {
    successReturnToOrRedirect: 'succes',
    failureRedirect: 'echec',
    session: false
  })(req, res, next);
});

/*
 * JSON Web Token
 */

connexionRouter.get('/jwt', (req, res, next) => {
  req._passport.instance.authenticate('cas', function (err, userInfo) {
    if (err) {
      console.error(err);
      return res.send(err)
    }
    req.logIn(userInfo, function (err) {
      if (err) {
        console.error(err);
        return res.send(err);
      }
      const user = {
        login: req.user.login,
        rules: req.createAbilities(req.user).rules,
        role: req.user.role
      }
      //
      console.debug(user)

      const token = jwt.sign(user, config.get('security.jwt.secretOrKey'), config.get('security.jwt.jsonWebTokenOptions'))
      //res.setHeader('Autorization', `Bearer ${token}`)

      req.session.jwt = token;

      let url = '/about';
      if (req.session && req.session.returnTo) {
        url = req.session.returnTo;
        delete req.session.returnTo;
      }
      if ('returnTo' in req.query) {
        url = req.query.returnTo;
      }

      // url = new URL(url, `${req.protocol}://${req.get('host')}${req.originalUrl}`)
      // url.searchParams.set('jwt', token)

      return res.redirect.relative(url);
    });

  })(req, res, next)
});

/*
 * Entry point for 'intelligent' guessing login method selection
 */

connexionRouter.get(/\/$/, (req, res, next) => {
  if (req.get('authorization')) {
    console.info('has authorization header');
    const authHeader = authorization.parse(req.get('authorization'));
    if (authHeader.scheme.toLowerCase() === 'hawk') {
      console.log(`redirecting to /hawk`);
      return res.redirect.relative(`./hawk`);
    }
    if (authHeader.scheme.toLowerCase() === 'bearer') {
      console.log(`redirecting to /jwt`);
      return res.redirect.relative(`./jwt`);
    }
  }
  console.log('no authorization header')
  // default authentication strategy
  console.log(`redirecting to ${req.baseUrl}/cas`)
  res.redirect.relative(`${req.baseUrl}/cas`);
});

const f = '<p><a href="../session">session</a></p><p><a href="../connexion">connexion</a></p><p><a href="../deconnexion">logout</a></p><p><a href="../admin">admin</a></p>';

connexionRouter.get('/succes', function (req, res) {
  console.log('/login success');
  // console.log(req.user);
  // console.log(req.session);
  console.log(req)
  res.send(f + '<p>login success</p><p>user: ' + req.user.login);
});

connexionRouter.get('/echec', function (req, res) {
  res.send(f + 'login failed');
});

export default connexionRouter;