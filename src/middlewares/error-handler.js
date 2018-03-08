module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const errorStatus = Number.isInteger(err.status) && err.status;
    ctx.status = 200;
    ctx.body = {
      error: {
        message: err.message,
      }
    };
    ctx.app.emit('error', err, ctx);
  }
};