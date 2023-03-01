import codeBib from 'code-bib'

const bibs = new Set(Object.keys(codeBib))

export function bibParamMiddleware(req, res, next) {

  const bib = req.params.bib || req.query.bib

  if (bib) {
    const message = [bib].flat().filter(b => !bibs.has(b)).map(b => `Code de bibliothèque inconnu: '${b}'`).join('. ')
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