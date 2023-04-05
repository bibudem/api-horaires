import { URL } from 'node:url'
import http from 'node:http'
import https from 'node:https'
import { parseString } from 'xml2js'
import passport from 'passport'
import processors from 'xml2js/lib/processors.js'

import { getRoleForGroup } from '../authorization/abilities.js'
import console from '../lib/console.js'

const xmlParseOpts = {
  trim: true,
  normalize: true,
  explicitArray: false,
  tagNameProcessors: [processors.normalize, processors.stripPrefix],
}

export class Strategy extends passport.Strategy {
  constructor(options, verify) {
    super()
    if (typeof options == 'function') {
      verify = options
      options = {}
    }

    console.log(options)

    if (!verify) {
      throw new Error('cas authentication strategy requires a verify function')
    }

    this.ssoBase = options.ssoBaseURL
    this.appBaseURL = options.appBaseURL
    this.validateURL = options.validateURL
    this.useSaml = options.useSaml || false
    this.parsed = new URL(this.ssoBase)

    if (this.parsed.protocol === 'http:') {
      this.client = http
    } else {
      this.client = https
    }

    this.name = 'cas'
    this._verify = verify
    this._passReqToCallback = options.passReqToCallback

    this._validateUri = '/serviceValidate.ashx'
  }

  _validate(req, body, verified) {
    const self = this
    parseString(body, xmlParseOpts, function (err, result) {
      if (err) {
        return verified(new Error('The response from the server was bad'))
      }
      try {
        if (result.serviceresponse.authenticationfailure) {
          return verified(new Error('Authentication failed ' + result.serviceresponse.authenticationfailure.$.code))
        }
        var success = result.serviceresponse.authenticationsuccess
        if (success) {
          const user = {
            login: success.user,
            expiration: success.expiration,
            signature: success.signature,
          }
          if (success.groupes) {
            user.groups = success.groupes.split('|')
            user.role = getRoleForGroup(user)
          }

          console.debug(`user.role: ${user.role}`)

          if (self._passReqToCallback) {
            self._verify(req, user, verified)
          } else {
            self._verify(user, verified)
          }
          return
        }
        return verified(new Error('Authentication failed'))
      } catch (error) {
        console.error(error)
        return verified(new Error('Authentication failed'))
      }
    })
  }

  service(req) {
    var serviceURL = req.originalUrl
    console.debug(`req.originalUrl: ${req.originalUrl}`)
    const url = new URL('.' + serviceURL, this.appBaseURL)
    url.hash = ''
    url.search = ''

    return url.href
  }

  authenticate(req, options) {
    options = options || {}

    const self = this

    // CAS Logout flow as described in
    // https://wiki.jasig.org/display/CAS/Proposal%3A+Front-Channel+Single+Sign-Out var relayState = req.query.RelayState;
    var relayState = req.query.RelayState
    if (relayState) {
      // logout locally
      req.logout()
      return this.redirect(this.ssoBase + '/logout.ashx?_eventId=next&RelayState=' + relayState)
    }

    const service = this.service(req)
    //console.log(service)
    const ticket = req.query.ticket
    if (!ticket) {
      const redirectURL = new URL(this.ssoBase + '/login.ashx')
      redirectURL.searchParams.append('service', service)

      // copy loginParams in login query
      for (var property in options.loginParams) {
        var loginParam = options.loginParams[property]
        if (loginParam) {
          redirectURL.searchParams.append(property, loginParam)
        }
      }
      return this.redirect(redirectURL.href)
    }

    const verified = function (err, user, info) {
      if (err) {
        return self.error(err)
      }
      if (!user) {
        return self.fail(info)
      }
      self.success(user, info)
    }
    const _validateUri = this.validateURL || this._validateUri

    const _handleResponse = function (response) {
      response.setEncoding('utf8')
      var body = ''
      response.on('data', function (chunk) {
        return (body += chunk)
      })
      return response.on('end', function () {
        return self._validate(req, body, verified)
      })
    }

    const url = new URL(this.parsed)
    url.pathname = url.pathname + _validateUri
    url.searchParams.append('ticket', ticket)
    url.searchParams.append('service', service)

    this.client
      .get(url, _handleResponse)

      .on('error', function (e) {
        console.error(e)
        return self.fail(new Error(e))
      })
  }
}
