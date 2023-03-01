import config from 'config'

const typesPeriodes = config.get('periodes')

export function listPeriodes(req, res, next) {
  res.json(typesPeriodes)
}