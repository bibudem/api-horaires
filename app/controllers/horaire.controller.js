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
      res.setHeader("Content-Type", "text/calendar");
      res.send(evenements.toICS())
    }
  } catch (error) {
    next(error)
  }
}

export async function postImport(req, res, next) {
  const horairesImporter = new HorairesImporter()

  horairesImporter.on('progress', throttle(progress => {
    res.write(`progress:${progress}`)
  }, 100))

  try {

    res.setHeader('Content-Type', 'text/html')

    const result = await horairesImporter.import()

    res.write(`result:${JSON.stringify(result)}`)
    res.end()

    console.log('result: ', result)
  } catch (error) {
    console.error('error ', error)
    next(error)
  }
}

// await postImport()