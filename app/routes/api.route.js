import config from 'config'
import { initializeApi, getAboutController } from '@bibudem/api-communs'
import pkg from '../../package.json' assert {type: 'json'}
import apiSchema from '../../config/schemas/openapi.json' assert {type: 'json'}
import { formatParamMiddleware } from '../middlewares/formatParam.middleware.js'
import { debutParamMiddleware } from '../middlewares/debutParam.middleware.js'
import { finParamMiddleware } from '../middlewares/finParam.middleware.js'
import { bibParamMiddleware } from '../middlewares/bibParam.middleware.js'
import { getHoraire } from '../controllers/horaire.controller.js'
import { listBibs } from '../controllers/bib.controller.js'
import { listServices } from '../controllers/services.controller.js'
import { listPeriodes } from '../controllers/periodes.controller.js'
import console from '../lib/console.js'


const operations = {
  getAbout: getAboutController(pkg),
  getHoraires: getHoraire,
  getHoraireByBib: getHoraire,
  getHoraireByBibICS: getHoraire,
  listBibs,
  listServices,
  listPeriodes
}

export default await initializeApi({
  apiSchema: {
    ...apiSchema,
    'x-express-openapi-validation-strict': false
  },
  middlewares: [
    formatParamMiddleware,
    debutParamMiddleware,
    finParamMiddleware,
    bibParamMiddleware
  ],
  apiBaseUrl: config.get('app.baseUrl'),
  operations,
  pkg
})