const originalRequire = require('module').prototype.require;
require('module').prototype.require = function(id) {
  if (id === undefined) {
    console.error("DEBUG TRACE: require(undefined) called at:");
    console.error(new Error().stack);
  }
  return originalRequire.apply(this, arguments);
};

const originalResolve = require('module')._resolveFilename;
require('module')._resolveFilename = function(request, parent, isMain, options) {
  if (request === undefined) {
    console.error("DEBUG TRACE: Module._resolveFilename(undefined) called at:");
    console.error(new Error().stack);
  }
  return originalResolve.apply(this, arguments);
};

// Start Next.js build
require('next/dist/bin/next');
