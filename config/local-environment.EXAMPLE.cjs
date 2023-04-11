module.exports = {
  log: {
    level: 'debug',
  },
  app: {
    host: 'localhost',
    port: 80,
    mountPath: '/',
    baseUrl: 'http://localhost/',
    sessionOptions: {
      secret: '<long random string>',
    },
  },
  db: {
    connectionSettings: {
      host: 'localhost',
      user: '<readOnly user name>',
      password: '<readOnly user password>',
      database: '<database name>',
    },
    connectionSettingsRW: {
      host: 'localhost',
      user: '<readAndWrite user name>',
      password: '<readAndWrite user password>',
      database: '<database name>',
    },
  },
  security: {
    basic: {
      key: '<long random string>',
    },
    hawk: {
      key: '<long random string>',
    },
    jwt: {
      secretOrKey: '<long random string>',
      jsonWebTokenOptions: {
        expiresIn: '1d',
        issuer: 'https://api.example.com/horaires',
      },
    },
  },
  httpClient: {
    proxy: false,
  },
}
