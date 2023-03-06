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

function wait(delay = 0) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

export async function postImport(req, res, next) {
  const horairesImporter = new HorairesImporter()

  horairesImporter.on(
    'progress',
    throttle(progress => {
      res.write(`progress:${progress}`)
    }, 100)
  )

  res.setHeader('Content-Type', 'application/json')

  try {
    const result = await horairesImporter.import()

    res.write(`result:${JSON.stringify(result)}`)
  } catch (error) {
    console.error('error: ', error)

    res.status(error.status).write(`result:${JSON.stringify(error)}`)
  } finally {
    res.end()
  }
}

// await postImport()
