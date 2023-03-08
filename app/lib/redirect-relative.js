import config from 'config'
import console from './console.js'

export default function () {
  return function (req, res, next) {
    res.redirect.relative = function relative(targetUrl, relativeTo = '/') {
      const url = req.app.locals.basePath + relativeTo.slice(1) + targetUrl
      console.log(`url: ${url}`)
      res.redirect(url)
    }
    next()
  }
}
