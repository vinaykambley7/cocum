import { UserAccount } from '../types/cucom';
import { CUCOM_STAFF } from './cucomCatalog';

export interface ManagerAccount extends UserAccount {
  isManager: boolean;
  loginRoleTitle: string;
  defaultPassword?: string;
}

export const ADMIN_USER: ManagerAccount = {
  id: 'admin-1',
  name: "Executive Administration (Dean's Office)",
  username: 'admin',
  role: 'ADMIN',
  department: 'Executive Leadership',
  designation: 'Executive Dean & Vice Chancellor',
  email: 'dean@cucom.edu.ag',
  isManager: true,
  loginRoleTitle: 'Executive Dean & Vice Chancellor',
  defaultPassword: '123',
};

// All 25 candidates are active managers/faculty required to submit daily reports
export const MANAGER_STAFF_IDS = CUCOM_STAFF.map(s => s.id);

// Generate clean user accounts for all 25 candidates
export const STAFF_ACCOUNTS: ManagerAccount[] = CUCOM_STAFF.map(staff => {
  // Create clean username: firstname.lastname or simple word
  const username = staff.name
    .toLowerCase()
    .replace(/^dr\s+/, '')
    .trim()
    .replace(/\s+/g, '.');

  return {
    id: `user-${staff.id}`,
    name: staff.name,
    username: username,
    role: 'STAFF',
    staffId: staff.id,
    department: staff.department,
    designation: staff.designation,
    email: staff.email,
    isManager: true,
    loginRoleTitle: `${staff.designation} (${staff.department})`,
    defaultPassword: '123',
  };
});

export const MANAGER_ACCOUNTS: ManagerAccount[] = STAFF_ACCOUNTS;
export const ALL_USERS: ManagerAccount[] = [ADMIN_USER, ...STAFF_ACCOUNTS];
export const AUTHORIZED_LOGIN_USERS: ManagerAccount[] = [ADMIN_USER, ...STAFF_ACCOUNTS];

// Authentication verification: Supports easy passwords ('123', 'cucom123', 'Manager@123', 'Faculty@123', etc.)
export function authenticateUser(usernameOrEmail: string, passwordInput: string): UserAccount | null {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const cleanPass = passwordInput.trim().toLowerCase();

  // Valid passwords: '123' for quick easy login, plus standard variants
  const validPasswords = ['123', 'cucom123', 'admin', 'admin123', 'password', 'manager@123', 'admin@123', 'faculty@123'];
  if (!validPasswords.includes(cleanPass)) {
    return null;
  }

  // Check Executive Dean / Admin
  if (cleanInput === 'admin' || cleanInput === 'dean' || cleanInput === 'dean@cucom.edu.ag') {
    return ADMIN_USER;
  }

  // Check all 25 candidate accounts
  const foundUser = AUTHORIZED_LOGIN_USERS.find(u => {
    const uName = u.username.toLowerCase();
    const uEmail = u.email.toLowerCase();
    const fullName = u.name.toLowerCase();
    const simplifiedName = fullName.replace(/[^a-z0-9]/g, '');
    const simplifiedInput = cleanInput.replace(/[^a-z0-9]/g, '');

    return (
      uName === cleanInput ||
      uEmail === cleanInput ||
      fullName === cleanInput ||
      simplifiedName === simplifiedInput ||
      u.staffId?.toLowerCase() === cleanInput ||
      u.id.toLowerCase() === cleanInput ||
      // match first name if unique
      uName.split('.')[0] === cleanInput
    );
  });

  return foundUser || null;
}

// Check authorization status
export function checkLoginAuthorizationStatus(usernameOrEmail: string): {
  isExcludedSupportStaff: boolean;
  message?: string;
} {
  return { isExcludedSupportStaff: false };
}
