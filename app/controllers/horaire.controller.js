import { throttle } from 'lodash-es'
import { Horaire, HorairesImporter } from '../models/horaire.js'
import console from '../lib/console.js'

export async function getHoraire(req, res, next) {
  const bib = req.params.bib || req.query.bib

  const format = req.format
  const debut = req.debut
  const fin = req.fin

  try {
    const evenements = await Horaire.get({ bib, debut, fin, ouvert: req.query.ouvert })
    if (format === 'json') {
      // JSON format
      return res.json(evenements)
    } else {
      res.setHeader('Content-Type', 'text/calendar')
      res.send(evenements.toICS())
    }
  } catch (error) {
    next(error)
  }
}

export async function postImport(req, res, next) {
  const horairesImporter = new HorairesImporter()
  let result

  horairesImporter.on(
    'progress',
    throttle(
      progress => {
        progress = Math.trunc(progress * 1e4) / 1e2
        res.write(`progress:${progress}`, () => {
          if (result) {
            res.write(`result:${JSON.stringify(result)}`)
            res.end()
          }
        })
      },
      100,
      { trailing: true }
    )
  )

  res.setHeader('Content-Type', 'application/json')

  try {
    result = await horairesImporter.import()
  } catch (error) {
    res.status(error.status).write(`result:${JSON.stringify(error)}`)
    res.end()
  }
}
