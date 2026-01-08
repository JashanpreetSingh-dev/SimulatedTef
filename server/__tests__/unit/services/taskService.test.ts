/**
 * Unit tests for task service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as taskService from '../../../services/taskService';
import { cleanupTestDb } from '../../helpers/testDb';
import { createTestReadingTask, createTestListeningTask } from '../../helpers/testFixtures';

describe('taskService', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  describe('validateTaskReference', () => {
    it('should validate existing reading task', async () => {
      const task = createTestReadingTask();
      await taskService.saveTask('reading', task);

      const isValid = await taskService.validateTaskReference(task.taskId, 'reading');
      expect(isValid).toBe(true);
    });

    it('should validate existing listening task', async () => {
      const task = createTestListeningTask();
      await taskService.saveTask('listening', task);

      const isValid = await taskService.validateTaskReference(task.taskId, 'listening');
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent task', async () => {
      const isValid = await taskService.validateTaskReference('non_existent', 'reading');
      expect(isValid).toBe(false);
    });

    it('should return false for wrong task type', async () => {
      const task = createTestReadingTask();
      await taskService.saveTask('reading', task);

      const isValid = await taskService.validateTaskReference(task.taskId, 'listening');
      expect(isValid).toBe(false);
    });
  });

  describe('getTask', () => {
    it('should get task by taskId', async () => {
      const task = createTestReadingTask();
      await taskService.saveTask('reading', task);

      const found = await taskService.getTask(task.taskId);
      expect(found).toBeDefined();
      expect(found?.taskId).toBe(task.taskId);
      expect(found?.type).toBe('reading');
    });

    it('should return null for non-existent task', async () => {
      const found = await taskService.getTask('non_existent');
      expect(found).toBeNull();
    });
  });

  describe('getTasks', () => {
    it('should get multiple tasks by taskIds', async () => {
      const task1 = createTestReadingTask({ taskId: 'reading_1' });
      const task2 = createTestReadingTask({ taskId: 'reading_2' });
      await taskService.saveTask('reading', task1);
      await taskService.saveTask('reading', task2);

      const tasks = await taskService.getTasks(['reading_1', 'reading_2']);
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.taskId)).toContain('reading_1');
      expect(tasks.map(t => t.taskId)).toContain('reading_2');
    });

    it('should return empty array for non-existent taskIds', async () => {
      const tasks = await taskService.getTasks(['non_existent_1', 'non_existent_2']);
      expect(tasks).toHaveLength(0);
    });
  });

  describe('listTasks', () => {
    beforeEach(async () => {
      const readingTask = createTestReadingTask({ taskId: 'reading_1' });
      const listeningTask = createTestListeningTask({ taskId: 'listening_1' });
      await taskService.saveTask('reading', readingTask);
      await taskService.saveTask('listening', listeningTask);
    });

    it('should list all tasks', async () => {
      const tasks = await taskService.listTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by type', async () => {
      const tasks = await taskService.listTasks({ type: 'reading' });
      expect(tasks.every(t => t.type === 'reading')).toBe(true);
    });

    it('should filter by isActive', async () => {
      const tasks = await taskService.listTasks({ isActive: true });
      expect(tasks.every(t => t.isActive === true)).toBe(true);
    });
  });
});
