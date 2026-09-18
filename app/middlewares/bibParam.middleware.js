import codeBib from 'code-bib'
import config from 'config'

const endpointsFromCodeBib = Object.keys(codeBib)
const availableEndpoints = endpointsFromCodeBib.concat(config.get('additionnalEndpoints'))

const bibs = new Set(...availableEndpoints)

export function bibParamMiddleware(req, res, next) {
  const bib = req.params.bib || req.query.bib

  if (bib) {
    const message = [bib]
      .flat()
      .filter(b => !bibs.has(b))
      .map(b => `Code de bibliothèque inconnu: '${b}'`)
      .join('. ')
    if (message.length) {
      return res.status(422).json({
        status: 422,
        message,
      })
    }

    req.bib = bib
  }

  next()
}
