import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import config from 'config'
import { resolve } from 'node:path'
import express, { Router } from 'express'
import { createServer as createViteDevServer } from 'vite'

const adminRoute = Router()

const basePath = (url => (url.pathname === '/' ? '' : url.pathname))(new URL(config.get('app.baseUrl')))

if (process.env.NODE_ENV.endsWith('production')) {
  adminRoute.use(express.static(fileURLToPath(new URL('../public/admin', import.meta.url))))
}

adminRoute.use('/', (req, res) => {
  res.render('index')
})

export default adminRoute
