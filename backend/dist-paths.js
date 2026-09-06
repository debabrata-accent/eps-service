// Runtime module alias resolver for the compiled production build.
// Maps the "@eps/shared" TypeScript path alias to its compiled JS location.
const path = require('path');
const Module = require('module');

const originalResolve = Module._resolveFilename;
const sharedDir = path.join(__dirname, 'dist', 'shared', 'src');

Module._resolveFilename = function (request, ...args) {
  if (request === '@eps/shared') {
    return originalResolve.call(this, path.join(sharedDir, 'index.js'), ...args);
  }
  return originalResolve.call(this, request, ...args);
};
