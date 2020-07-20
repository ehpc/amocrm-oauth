import nodeFetch from 'node-fetch';

/**
 * Fetch which hides try catch
 * @param {string} url URL to fetch
 * @param {object} fetchOptions Options for fetch fn
 * @param {object} options Other options
 */
export default async function fetch(url, fetchOptions, options) {
  let res;
  try {
    res = await nodeFetch(url, fetchOptions);
  } catch (e) {
    if (options.logger) {
      options.logger.warn('Fetch failed with', e);
    }
    return options.defaultResult;
  }
  if (options.resultType === 'result') {
    return res;
  }
  return res[options.resultType || 'json']();
}
