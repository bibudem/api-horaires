const { readFileSync } = require('fs')
const { join } = require('path')
const { abilities } = require('./abilities.cjs')
const users = require('./users.cjs')

const periodes = require('./types-periodes')
const services = require('./types-services')

const privateKey = readFileSync(join(__dirname, 'private.ppk'), 'utf-8')
const publicKey = readFileSync(join(__dirname, 'public.pem'), 'utf-8')

module.exports = {
  log: {
    dir: 'logs',
    level: 'info',
  },
  app: {
    baseUrl: 'https://api.bib.umontreal.ca/horaires',
    port: 8000,
  },
  ics: {
    ttl: 'P1H',
  },
  db: {
    connectionSettings: {
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
    },
    connectionSettingsRW: {
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
      idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
      queueLimit: 0,
    },
  },
  httpClient: {
    proxy: 'http://mandataire.ti.umontreal.ca:80',
  },
  services,
  periodes,
  security: {
    useAuth: true,
    roles: Object.keys(abilities),
    abilities,
    users,
    privateKey,
    publicKey,
  },
}
