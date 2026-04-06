/**
 * Chuẩn hóa payload đăng nhập từ API.
 * Backend dùng spring.jackson.property-naming-strategy=SNAKE_CASE → JSON dùng access_token, full_name...
 * @param {object} result - data.result từ ApiResponse
 * @returns {{ accessToken: string, role: string, userId: string|null, fullName: string, email: string }|null}
 */
export function normalizeLoginResult(result) {
  if (!result || typeof result !== 'object') return null;

  const accessToken = result.access_token ?? result.accessToken;
  const rawUser = result.user ?? {};
  const role = rawUser.role;
  const userId = rawUser.id ?? null;
  const fullName = rawUser.full_name ?? rawUser.fullName ?? '';
  const email = rawUser.email ?? '';

  if (!accessToken || !role) return null;

  return { accessToken, role, userId, fullName, email };
}

/**
 * Chuẩn hóa một user từ API (snake_case → dùng cho UI)
 */
export function normalizeUserDto(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.full_name ?? u.fullName,
    role: u.role,
    active: u.active ?? u.is_active,
  };
}
