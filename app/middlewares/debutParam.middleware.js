import { DateTime } from 'luxon'
import { parseDate } from '../lib/dateTime-utils.js'

export function debutParamMiddleware(req, res, next) {

  try {
    const today = DateTime.now().set({ hours: 0, minute: 0, second: 0, millisecond: 0 }).toSQLDate()
    const debut = req.query.debut ? parseDate(req.query.debut) : today

    req.debut = debut

    next()
  } catch (error) {
    res.status(422).json({
      status: 422,
      message: error.message,
    })
  }
}