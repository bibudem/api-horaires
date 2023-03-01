const ANONYMOUS_USER = 'default'

const readAll = {
  subject: 'all',
  actions: 'read'
};

module.exports = {
  ANONYMOUS_USER,
  abilities: {
    'admin': [{
      subject: 'all',
      actions: 'manage' // alias for create, read, update and delete all together
    }],
    'client': [{
      subject: 'Device',
      actions: ['read', 'create', 'update']
    }],
    // anonymous access
    [ANONYMOUS_USER]: [{
      subject: 'Device',
      actions: 'read'
    },
      readAll
    ]
  }
}