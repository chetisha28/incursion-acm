import { ApiError } from '../utils/apiError.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required', 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
    return next();
  };
}
