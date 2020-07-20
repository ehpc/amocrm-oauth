/**
 * Propagates HTTP status code if async function fails
 * @param {function} fn Function
 * @param {object} response Express response object
 * @param {number} status HTTP status code
 * @param {object} logger Logger
 */
export function catchToStatus(fn, response, status, logger) {
  return async (...args) => {
    let result;
    try {
      result = await fn.apply(this, args);
    } catch (e) {
      logger.error(e);
      response.status(status).end();
    }
    return result;
  };
}

/**
 * Propagates HTTP status code 500 if async function fails
 * @param {function} fn Function
 * @param {object} response Express response object
 * @param {object} logger Logger
 */
export function catchToStatus500(fn, response, logger) {
  return catchToStatus.call(this, fn, response, 500, logger);
}

export default {
  catchToStatus,
  catchToStatus500,
};
