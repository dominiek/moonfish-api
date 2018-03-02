module.exports = (err, req, res, next) => {
  if (!err) return next();
  return res.json({
    error: {
      message: err.message,
    },
  });
};