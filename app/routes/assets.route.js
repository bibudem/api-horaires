import { fileURLToPath } from 'node:url'
import sirv from 'sirv'

const assetsRoute = sirv(fileURLToPath(new URL('../public/assets', import.meta.url)), {
  maxAge: 2592000, // 30D
  immutable: true,
  gzip: true,
  brotli: true,
})

export default assetsRoute
