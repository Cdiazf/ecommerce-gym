export type UserRole = 'ADMIN' | 'USER';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}
