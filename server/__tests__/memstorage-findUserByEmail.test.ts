import { MemStorage } from '../storage';
import { User, Organization } from '../../shared/schema';

describe('MemStorage.findUserByEmail', () => {
  let storage: MemStorage;
  let org1: Organization;
  let org2: Organization;
  let user1: User;
  let user2: User;

  beforeEach(async () => {
    storage = new MemStorage();
    org1 = { id: 1, name: 'Org1', createdAt: new Date() };
    org2 = { id: 2, name: 'Org2', createdAt: new Date() };
    // @ts-ignore
    storage.organizations.set(org1.id, org1);
    // @ts-ignore
    storage.organizations.set(org2.id, org2);
    user1 = {
      id: 1,
      username: 'user1',
      email: 'user@example.com',
      password: 'hash1',
      role: 'recruiter',
      active: true,
      organizationId: org1.id,
      lastLogin: null,
      fullName: 'User One'
    };
    user2 = {
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      password: 'hash2',
      role: 'recruiter',
      active: true,
      organizationId: org2.id,
      lastLogin: null,
      fullName: 'User Two'
    };
    // @ts-ignore
    storage.users.set(user1.id, user1);
    // @ts-ignore
    storage.users.set(user2.id, user2);
  });

  it('находит пользователя по email среди всех организаций', async () => {
    const found = await storage.findUserByEmail('user@example.com');
    expect(found).toBeDefined();
    expect(found!.id).toBe(user1.id);
    expect(found!.organizationId).toBe(org1.id);
  });

  it('возвращает undefined если email не найден', async () => {
    const found = await storage.findUserByEmail('nope@example.com');
    expect(found).toBeUndefined();
  });

  it('находит пользователя из другой организации', async () => {
    const found = await storage.findUserByEmail('user2@example.com');
    expect(found).toBeDefined();
    expect(found!.id).toBe(user2.id);
    expect(found!.organizationId).toBe(org2.id);
  });
});
