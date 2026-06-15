const originalResolve = require('module')._resolveFilename;
require('module')._resolveFilename = function(request, parent, isMain, options) {
  if (request === undefined || request === null || typeof request !== 'string') {
    console.error("=========================================");
    console.error("FATAL: Module._resolveFilename called with:", request);
    console.error(new Error().stack);
    console.error("=========================================");
  }
  return originalResolve.apply(this, arguments);
};

const originalFsRead = require('fs').readFileSync;
require('fs').readFileSync = function(path, options) {
  if (path === undefined || path === null || typeof path !== 'string' && !Buffer.isBuffer(path) && !(path instanceof URL)) {
    console.error("=========================================");
    console.error("FATAL: fs.readFileSync called with:", path);
    console.error(new Error().stack);
    console.error("=========================================");
  }
  return originalFsRead.apply(this, arguments);
};
