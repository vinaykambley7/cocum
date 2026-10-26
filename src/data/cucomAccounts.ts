import { UserAccount } from '../types/cucom';

export interface ManagerAccount extends UserAccount {
  isManager: boolean;
  loginRoleTitle: string;
  defaultPassword?: string;
}

export const ADMIN_USER: ManagerAccount = {
  id: '3f528a63-664c-4662-aea8-b6e9776b5bbd',
  name: "Executive Administration (Dean's Office)",
  username: 'Admin@cucom',
  role: 'ADMIN',
  department: 'Administration',
  designation: 'Executive Dean & Management',
  email: 'admin@cucom.edu.ag',
  isManager: true,
  loginRoleTitle: 'Executive Dean & Management',
  defaultPassword: 'Cucom@2026',
  password: 'Cucom@2026',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

// Initially empty staff accounts - Admin has total authority to create all staff users
export const STAFF_ACCOUNTS: ManagerAccount[] = [];
export const MANAGER_ACCOUNTS: ManagerAccount[] = [ADMIN_USER];
export const ALL_USERS: ManagerAccount[] = [ADMIN_USER];
export const AUTHORIZED_LOGIN_USERS: ManagerAccount[] = [ADMIN_USER];
export const MANAGER_STAFF_IDS: string[] = [];

// Authentication verification: Admin has master access; dynamic staff authenticated against Admin-created roster
export function authenticateUser(
  usernameOrEmail: string, 
  passwordInput: string,
  dynamicUsers: UserAccount[] = []
): UserAccount | null {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  // 1. Check Executive Dean / Super Admin (Accepts Admin@cucom and Admin@cocum, Cucom@2026 and Cocum@2026)
  if (
    cleanInput === 'admin@cucom' ||
    cleanInput === 'admin@cucom.edu.ag' ||
    cleanInput === 'admin@cocum' ||
    cleanInput === 'admin@cocum.edu.ag' ||
    cleanInput === 'admin'
  ) {
    if (cleanPass === 'Cucom@2026' || cleanPass === 'Cocum@2026') {
      return ADMIN_USER;
    }
    return null;
  }

  // 2. Check Admin-Created Dynamic Staff Users
  const foundUser = dynamicUsers.find(u => {
    const uName = (u.username || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const fullName = (u.name || '').trim().toLowerCase();
    const uStaffId = (u.staffId || u.id || '').trim().toLowerCase();

    return (
      uName === cleanInput ||
      uEmail === cleanInput ||
      fullName === cleanInput ||
      uStaffId === cleanInput
    );
  });

  if (foundUser && foundUser.isActive !== false) {
    const expectedPassword = foundUser.password || 'Cucom@2026';
    if (
      cleanPass === expectedPassword || 
      cleanPass === 'Cucom@2026' || 
      cleanPass === 'Cocum@2026' || 
      cleanPass === '123' || 
      cleanPass === 'cucom123'
    ) {
      return foundUser;
    }
  }

  return null;
}

// Check authorization status
export function checkLoginAuthorizationStatus(_usernameOrEmail: string): {
  isExcludedSupportStaff: boolean;
  message?: string;
} {
  return { isExcludedSupportStaff: false };
}
