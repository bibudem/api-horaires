import { parseDate } from '../lib/dateTime-utils.js'

export function finParamMiddleware(req, res, next) {

  try {

    const farFarAway = '9999-12-31'
    const fin = req.query.fin ? parseDate(req.query.fin, req.debut) : farFarAway

    req.fin = fin

    next()
  } catch (error) {
    res.status(422).json({
      status: 422,
      message: error.message,
    })
  }
}