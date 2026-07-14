export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Not found - ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  const code = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.status(code).json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
