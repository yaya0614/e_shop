import type { EmployeeRole, UserRole } from '~/prisma/generated/enums';

export interface TokenPayload {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  role: UserRole;
  vendor: {
    id: string;
    role: EmployeeRole;
  } | null;
}

export interface AuthContextPayload {
  authenticated: boolean;
  userId: string | null;
  error: {
    code: number | null;
    message: string | null;
  };
  role: UserRole;
  vendor: {
    id: string;
    role: EmployeeRole;
  } | null;
}
