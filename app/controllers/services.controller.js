import config from 'config'

const services = config.get('services')
const typesServices = {};

Object.keys(services).forEach(key => {
  typesServices[key] = {
    ...services[key]
  }
  typesServices[key].key = key
});

export function listServices(req, res, next) {
  res.json(typesServices)
}