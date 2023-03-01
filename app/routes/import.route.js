import { Router } from 'express'
import { postImport } from '../controllers/horaire.controller.js'

const importRoute = Router();

importRoute.post('/', postImport)

export default importRoute;