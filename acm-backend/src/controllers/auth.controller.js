import { changePassword as changePasswordService, login as loginService, logout as logoutService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const executiveLogin = asyncHandler(async (req, res) => {
  const result = await loginService('executive', req.body);
  res.json({ success: true, message: 'Executive login successful', data: result });
});

export const coreLogin = asyncHandler(async (req, res) => {
  const result = await loginService('core', req.body);
  res.json({ success: true, message: 'Core login successful', data: result });
});

export const logout = asyncHandler(async (req, res) => {
  await logoutService(req.auth.jti);
  res.json({ success: true, message: 'Session revoked successfully', data: null });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Current user fetched successfully', data: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await changePasswordService(req.user.id, req.body);
  res.json({ success: true, message: 'Password updated successfully', data: result });
});
