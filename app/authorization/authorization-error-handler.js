const { ForbiddenError } = require('@casl/ability');
const Boom = require('boom');

module.exports = function errorHandler(error, req, res, next) {
	//console.log('authorizationErrorHandler')
	if (error instanceof ForbiddenError) {
		error = Boom.forbidden(error.message, error);
	}
	next(error);
}