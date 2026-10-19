// This boundary currently accepts a caller-provided HTTPS URL. Replace this implementation
// with signed upload URLs and object metadata when S3 or Cloudinary is configured.
export function receiptReference(value) {
  if (value == null) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Receipt URLs must use HTTPS');
  return url.toString();
}
