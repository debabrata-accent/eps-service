import bcrypt from 'bcryptjs';
import User from '../models/User';
import { Role } from '@eps/shared';

const SALT_ROUNDS = 12;

export const SEED_USERS = [
  {
    username: 'ce_admin_01',
    password: 'Admin@1234',
    role: Role.CUSTOMER_EXECUTIVE,
    fullName: 'Admin User',
    email: 'admin@epsservice.com',
    phone: '9000000001',
  },
  {
    username: 'factory_owner_01',
    password: 'Owner@1234',
    role: Role.FACTORY_OWNER,
    fullName: 'Rajesh Kumar',
    email: 'rajesh@factory1.com',
    phone: '9000000002',
    companyName: 'Kumar Industries Pvt Ltd',
  },
  {
    username: 'factory_owner_02',
    password: 'Owner@1234',
    role: Role.FACTORY_OWNER,
    fullName: 'Sunita Mehta',
    email: 'sunita@factory2.com',
    phone: '9000000003',
    companyName: 'Mehta Manufacturing Co',
  },
  {
    username: 'engineer_01',
    password: 'Eng@1234',
    role: Role.ENGINEER,
    fullName: 'Amit Sharma',
    email: 'amit@epsservice.com',
    phone: '9000000004',
    engineerSpecialization: 'LV/MV Panel Maintenance',
  },
  {
    username: 'engineer_02',
    password: 'Eng@1234',
    role: Role.ENGINEER,
    fullName: 'Priya Nair',
    email: 'priya@epsservice.com',
    phone: '9000000005',
    engineerSpecialization: 'VFD & PLC Systems',
  },
];

/**
 * Seeds the standard test users. Idempotent — skips users that already exist.
 * Returns counts of created and skipped users.
 */
export const seedUsers = async (): Promise<{ created: number; skipped: number }> => {
  let created = 0;
  let skipped = 0;

  for (const userData of SEED_USERS) {
    const exists = await User.findOne({ username: userData.username });
    if (exists) {
      skipped++;
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await User.create({
      username: userData.username,
      passwordHash,
      role: userData.role,
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      companyName: (userData as any).companyName,
      engineerSpecialization: (userData as any).engineerSpecialization,
      isActive: true,
    });
    created++;
  }

  return { created, skipped };
};
