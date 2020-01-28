const fs = require('fs');
const Response = require('./lib/response');
const CONTENT_TYPES = require('./lib/mimeTypes');
const {loadTemplate} = require('./lib/viewTemplate');
const STATIC_FOLDER = `${__dirname}/public`;

const serveStaticFile = (req, optionalUrl) => {
  const path = `${STATIC_FOLDER}${optionalUrl || req.url}`;
  const stat = fs.existsSync(path) && fs.statSync(path);
  if (!stat || !stat.isFile()) return new Response();
  const [, extension] = path.match(/.*\.(.*)$/) || [];
  const contentType = CONTENT_TYPES[extension];
  const content = fs.readFileSync(path);
  const res = new Response();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', content.length);
  res.statusCode = 200;
  res.body = content;
  return res;
}

const loadSessions = function() {
  const path = `./data/sessions.json`;
  if(!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const serveHomePage = function(req) {
  const cookie = req.headers.Cookie || '';
  if(!cookie.includes('session-id')) return serveStaticFile(req, '/index.html');
  const sessions = loadSessions();
  const {name, sessionId} = sessions.find(user => user.sessionId == cookie.split('=')[1]);
  if(sessionId == undefined) return serveStaticFile(req, '/index.html');
  const conversationHtml = conversation.reduce((html, messageDetail) => {
    const message = `<div class="mess">
      <span class="user">${messageDetail.name}</span></br>
      ${messageDetail.message}
    </div></br>`;
    return message + html;
  },'');
  const html = loadTemplate('home.html', {name, messages:conversationHtml});
  const res = new Response();
  res.setHeader('Content-Type', CONTENT_TYPES.html);
  res.setHeader('Set-Cookie', cookie);
  res.setHeader('Content-Length', html.length);
  res.statusCode = 200;
  res.body = html;
  return res;
};

const redirectTo = function(location, sessionId) {
  const res = new Response();
  res.setHeader('Location', location);
  res.setHeader('Content-Length', 0);
  res.setHeader('Set-Cookie', `session-id=${sessionId}`);
  res.statusCode = 301;
  return res;
}

const serveConversationPage = function(req) {
  const {name} = req.body;
  const sessions = loadSessions();
  const sessionId = new Date().getTime();
  sessions.push({sessionId, name});
  fs.writeFileSync(`./data/sessions.json`, JSON.stringify(sessions), 'utf8');
  return redirectTo('/', sessionId);
}

const conversation = [];

const saveMessageAndRedirect = function(req) {
  const cookie = req.headers.Cookie || '';
  if(!cookie.includes('session-id')) return serveStaticFile(req, '/index.html');
  const sessions = loadSessions();
  const user = sessions.find(user => user.sessionId == cookie.split('=')[1]);
  if(user == undefined) return serveStaticFile(req, '/index.html');
  const message = req.body.message;
  const {name, sessionId} = user;
  conversation.push({name, message});
  console.log(conversation);
  return redirectTo('/', sessionId);
};

const findHandler = (req) => {
  if(req.method === 'GET' && req.url === '/') return serveHomePage;
  if(req.method === 'POST' && req.url === '/login') return serveConversationPage;
  if(req.method === 'POST' && req.url === '/sendMessage') return saveMessageAndRedirect;
  if(req.method === 'GET') return serveStaticFile;
  return () => new Response();
}
const processRequest = (req) => {
  const handler = findHandler(req);
  return handler(req);
}

module.exports = {processRequest};