const http = require('http');

const catchAsyncErrors = (fn) => {
  return (req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise && routePromise.catch) {
      routePromise.catch(err => next(err));
    }
  };
};

const flatten = (list) => list.reduce((a, b) => {
  return a.concat(Array.isArray(b) ? flatten(b) : b);
}, []);

const methods = http.METHODS && http.METHODS.map((method) => method.toLowerCase());

const asyncRouter = (router) => {
  [...methods, 'all'].forEach((method) => {
    const original = router[method];
    router[method] = function (path, ...rest) { //eslint-disable-line
      const handles = flatten(rest);
      const patched = [];

      handles.forEach((handle) => {
        if (typeof handle !== 'function') {
          const type = toString.call(handle);
          const msg = `Route.${method}() requires a callback function but got a ${type}`;
          throw new TypeError(msg);
        }

        patched.push(catchAsyncErrors(handle));
      });

      original.call(this, path, patched);
    };
  });

  const useOriginal = router.use;
  router.use = (...args) => { // eslint-disable-line
    const handles = typeof args[0] === 'string' ? args.slice(1) : args;
    const path = typeof args[0] === 'string' && args[0];
    const patched = [];

    handles.forEach((handle) => {
      if (typeof handle !== 'function') {
        patched.push(handle);
        return;
      }
      patched.push(catchAsyncErrors(handle));
    });

    if (path) {
      useOriginal.call(router, path, ...patched);
    } else {
      useOriginal.call(router, ...patched);
    }
    return this;
  };

  return router;
};

module.exports = asyncRouter;