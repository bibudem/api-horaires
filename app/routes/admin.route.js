import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import config from 'config'
import { resolve } from 'node:path'
import express, { Router } from 'express'
import { createServer as createViteDevServer } from 'vite'

const adminRoute = Router()

const basePath = (url => (url.pathname === '/' ? '' : url.pathname))(new URL(config.get('app.baseUrl')))

// const vite = await createViteDevServer({
//   base: `${basePath}/`,
//   server: { middlewareMode: true },
//   appType: 'custom',
//   // watch: {
//   //   // During tests we edit the files too fast and sometimes chokidar
//   //   // misses change events, so enforce polling for consistency
//   //   usePolling: true,
//   //   interval: 100,
//   // },
// })

// adminRoute.use(vite.middlewares)

if (process.env.NODE_ENV.endsWith('production')) {
  adminRoute.use(express.static(fileURLToPath(new URL('../public/admin', import.meta.url))))
}

adminRoute.use('/', (req, res) => {
  res.render('index')
})

// adminRoute.use('*', async (req, res, next) => {
//   const url = req.originalUrl

//   try {
//     // 1. Read index.html
//     let template = readFileSync(new URL('../public/admin/index.html', import.meta.url), 'utf-8')

//     // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
//     //    and also applies HTML transforms from Vite plugins, e.g. global
//     //    preambles from @vitejs/plugin-react
//     template = await vite.transformIndexHtml(url, '')

//     console.log(template)

//     // 3. Load the server entry. ssrLoadModule automatically transforms
//     //    ESM source code to be usable in Node.js! There is no bundling
//     //    required, and provides efficient invalidation similar to HMR.
//     const { render } = await vite.ssrLoadModule('/src/entry-server.js')

//     // 4. render the app HTML. This assumes entry-server.js's exported
//     //     `render` function calls appropriate framework SSR APIs,
//     //    e.g. ReactDOMServer.renderToString()
//     const appHtml = await render(url)

//     // 5. Inject the app-rendered HTML into the template.
//     const html = template.replace(`<!--ssr-outlet-->`, appHtml)

//     // 6. Send the rendered HTML back.
//     res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
//   } catch (e) {
//     // If an error is caught, let Vite fix the stack trace so it maps back
//     // to your actual source code.
//     vite.ssrFixStacktrace(e)
//     next(e)
//   }
// })

export default adminRoute
