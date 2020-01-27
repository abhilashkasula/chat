const { Server } = require('net');
const Request = require('./lib/request');
const {processRequest} = require('./app');

const handleConnection = function (socket) {
  const remote = `${socket.remoteAddress}:${socket.remotePort}`;
  console.warn('new connection', remote);
  socket.setEncoding('utf8');
  socket.on('close', (hadError) => console.warn(`${remote} closed ${hadError ? 'with error' : ''}`));
  socket.on('end', () => console.warn(`${remote} ended`));
  socket.on('error', (err) => console.error('socket error', err));
  socket.on('drain', () => console.warn(`${remote} drained`));
  socket.on('data', (text) => {
    console.warn(`${remote} data:\n`);
    const req = Request.parse(text);
    const res = processRequest(req);
    res.writeTo(socket);
  });
}
const main = (port=4000) => {
  const server = new Server();
  server.on('error', err => console.error('server error', err));
  server.on('connection', handleConnection);
  server.on('listening', () => console.warn('started listening', server.address()));
  server.listen(port);
}
main(process.argv[2]);