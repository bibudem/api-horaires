
export function formatParamMiddleware(req, res, next) {
  const accepts = req.accepts(['*/*', 'text/calendar', 'application/json'])
  const acceptMap = {
    'text/calendar': 'ics',
    'application/json': 'json'
  }

  if (accepts === false) {
    return res.status(415).json({
      status: 415,
      message: `Unsupported Media Type '${req.get('accept')}'`,
    })
  }

  req.format = accepts === '*/*' ? (req.params.format || req.query.format) ?? 'json' : acceptMap[accepts]

  next()
}