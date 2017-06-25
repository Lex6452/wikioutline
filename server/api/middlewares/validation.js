// @flow
import apiError from '../../errors';
import validator from 'validator';

export default function validation() {
  return function validationMiddleware(ctx, next) {
    ctx.assertPresent = function assertPresent(value, message) {
      if (value === undefined || value === null || value === '') {
        throw apiError(400, 'validation_error', message);
      }
    };

    ctx.assertEmail = (value, message) => {
      if (!validator.isEmail(value)) {
        throw apiError(400, 'validation_error', message);
      }
    };

    ctx.assertUuid = (value, message) => {
      if (!validator.isUUID(value)) {
        throw apiError(400, 'validation_error', message);
      }
    };

    ctx.assertPositiveInteger = (value, message) => {
      if (!validator.isInt(value, { min: 0 })) {
        throw apiError(400, 'validation_error', message);
      }
    };

    return next();
  };
}
