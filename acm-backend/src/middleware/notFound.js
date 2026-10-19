export function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
}
