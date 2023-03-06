import { fileURLToPath } from 'node:url'
import sirv from 'sirv'
import config from 'config'
import { resolve } from 'node:path'
import { Router } from 'express'

const adminRoute = Router()

console.log(':: ', process.env.NODE_ENV)

const basePath = (url => (url.pathname === '/' ? '' : url.pathname))(new URL(config.get('app.baseUrl')))

if (process.env.NODE_ENV.endsWith('production')) {
  // adminRoute.use(express.static(fileURLToPath(new URL('../public', import.meta.url))))
  adminRoute.use(
    (req, res, next) => {
      console.log(req.url)
      next()
    },
    sirv(fileURLToPath(new URL('../public', import.meta.url)), {
      maxAge: 2592000, // 30D
      immutable: true,
      setHeaders(res, pathname) {
        console.log(pathname)
      },
    })
  )
}

adminRoute.use('/', (req, res) => {
  res.render('index')
})

export default adminRoute
