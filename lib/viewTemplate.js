const fs = require('fs');
const TEMPLATES_FOLDER = `${__dirname}/../templates`;
const loadTemplate = (templateFileName, propertyBag) => {
  const content = fs.readFileSync(`${TEMPLATES_FOLDER}/${templateFileName}`, 'utf8');
  const replaceKeyWithValue = (content, key) => {
    const pattern = new RegExp(`__${key}__`, 'g');
    return content.replace(pattern, propertyBag[key]);
  }
  const keys = Object.keys(propertyBag);
  const html = keys.reduce(replaceKeyWithValue, content);
  return html;
}

module.exports = { loadTemplate };