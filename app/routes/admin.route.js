import { Router } from 'express'

const adminRoute = Router()

adminRoute.use('/', (req, res) => {
  res.render('index')
})

export default adminRoute
