/**
 * Safely crawls object converted from JSON
 * @param {object} jsonObject Object constructed from JSON
 * @param {string} path Path to crawl (a.b.c)
 */
export default function crawlJSON(jsonObject, path) {
  const pathParts = path.split('.');
  if (typeof jsonObject !== 'object') {
    return undefined;
  }
  let obj = jsonObject;
  for (let i = 0; i < pathParts.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(obj, pathParts[i])) {
      obj = obj[pathParts[i]];
    } else {
      return undefined;
    }
  }
  return obj;
}
