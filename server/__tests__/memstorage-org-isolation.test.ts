import { MemStorage } from '../storage';
import type { InsertTest } from '../../shared/schema';

import type { InsertCandidate, InsertQuestion } from '../../shared/schema';

describe('MemStorage organization isolation', () => {
  let storage: MemStorage;
let org1: Awaited<ReturnType<MemStorage['createOrganization']>>;
let org2: Awaited<ReturnType<MemStorage['createOrganization']>>;

  beforeEach(async () => {
    storage = new MemStorage();
    org1 = await storage.createOrganization({ name: 'Org 1' });
    org2 = await storage.createOrganization({ name: 'Org 2' });
  });

  it('should isolate tests between organizations', async () => {
    // 1. Создаём по тесту для каждой организации
    const test1 = await storage.createTest(org1.id, {
      name: 'Test Org1',
      description: 'desc',
      createdBy: 1,
      timeLimit: null,
      isActive: true,
      passingScore: 70
    } as InsertTest);
    const test2 = await storage.createTest(org2.id, {
      name: 'Test Org2',
      description: 'desc',
      createdBy: 2,
      timeLimit: null,
      isActive: true,
      passingScore: 70
    } as InsertTest);

    // 3. Проверяем, что тесты доступны только своей организации
    const org1Tests = await storage.getAllTests(org1.id);
    const org2Tests = await storage.getAllTests(org2.id);
    expect(org1Tests).toHaveLength(1);
    expect(org2Tests).toHaveLength(1);
    expect(org1Tests[0].id).toBe(test1.id);
    expect(org2Tests[0].id).toBe(test2.id);

    // 4. Проверяем, что чужой тест не виден
    const test1FromOrg2 = await storage.getTest(org2.id, test1.id);
    const test2FromOrg1 = await storage.getTest(org1.id, test2.id);
    expect(test1FromOrg2).toBeUndefined();
    expect(test2FromOrg1).toBeUndefined();
  });

  it('should isolate candidates between organizations', async () => {
    const candidate1 = await storage.createCandidate(org1.id, {
      name: 'Cand Org1',
      email: 'cand1@org1.com',
      organizationId: org1.id
    } as InsertCandidate);
    const candidate2 = await storage.createCandidate(org2.id, {
      name: 'Cand Org2',
      email: 'cand2@org2.com',
      organizationId: org2.id
    } as InsertCandidate);

    const org1Candidates = await storage.getAllCandidates(org1.id);
    const org2Candidates = await storage.getAllCandidates(org2.id);
    expect(org1Candidates).toHaveLength(1);
    expect(org2Candidates).toHaveLength(1);
    expect(org1Candidates[0].id).toBe(candidate1.id);
    expect(org2Candidates[0].id).toBe(candidate2.id);

    const cand1FromOrg2 = await storage.getCandidate(org2.id, candidate1.id);
    const cand2FromOrg1 = await storage.getCandidate(org1.id, candidate2.id);
    expect(cand1FromOrg2).toBeUndefined();
    expect(cand2FromOrg1).toBeUndefined();
  });

  it('should isolate questions between organizations', async () => {
    const test1 = await storage.createTest(org1.id, {
      name: 'Test Org1',
      description: 'desc',
      createdBy: 1,
      timeLimit: null,
      isActive: true,
      passingScore: 70
    } as InsertTest);
    const test2 = await storage.createTest(org2.id, {
      name: 'Test Org2',
      description: 'desc',
      createdBy: 2,
      timeLimit: null,
      isActive: true,
      passingScore: 70
    } as InsertTest);

    const question1 = await storage.createQuestion(org1.id, {
      testId: test1.id,
      content: 'Q1',
      type: 'single',
      options: JSON.stringify(['a', 'b']),
      correctAnswer: JSON.stringify([0]),
      order: 1,
      organizationId: org1.id,
      points: 1
    } as InsertQuestion);
    const question2 = await storage.createQuestion(org2.id, {
      testId: test2.id,
      content: 'Q2',
      type: 'single',
      options: JSON.stringify(['x', 'y']),
      correctAnswer: JSON.stringify([1]),
      order: 1,
      organizationId: org2.id,
      points: 1
    } as InsertQuestion);

    const org1Questions = await storage.getQuestionsByTestId(org1.id, test1.id);
    const org2Questions = await storage.getQuestionsByTestId(org2.id, test2.id);
    expect(org1Questions).toHaveLength(1);
    expect(org2Questions).toHaveLength(1);
    expect(org1Questions[0].id).toBe(question1.id);
    expect(org2Questions[0].id).toBe(question2.id);

    // Чужой вопрос не виден
    const org1QuestionsFromOrg2 = await storage.getQuestionsByTestId(org2.id, test1.id);
    const org2QuestionsFromOrg1 = await storage.getQuestionsByTestId(org1.id, test2.id);
    expect(org1QuestionsFromOrg2).toHaveLength(0);
    expect(org2QuestionsFromOrg1).toHaveLength(0);
  });
});
