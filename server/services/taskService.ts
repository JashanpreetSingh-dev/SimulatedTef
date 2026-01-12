/**
 * Task service for CRUD operations on normalized tasks
 */

import { MongoClient, ObjectId } from 'mongodb';
import { NormalizedTask, TaskType, generateTaskId } from '../../types/task';
import { TEFTask, WrittenTask, ReadingTask, ListeningTask } from '../../types';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'tef_master';

let client: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

async function getDB() {
  const client = await getClient();
  return client.db(dbName);
}

/**
 * Save or update a task
 */
export async function saveTask(
  type: TaskType,
  taskData: TEFTask | WrittenTask | ReadingTask | ListeningTask
): Promise<NormalizedTask> {
  const db = await getDB();
  const taskId = generateTaskId(type, taskData);
  
  const task: NormalizedTask = {
    taskId,
    type,
    taskData: taskData as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };
  
  // Upsert task by taskId
  await db.collection('tasks').updateOne(
    { taskId },
    { $set: task },
    { upsert: true }
  );
  
  return task;
}

/**
 * Get task by taskId
 */
export async function getTask(taskId: string): Promise<NormalizedTask | null> {
  const db = await getDB();
  const task = await db.collection('tasks').findOne({ taskId });
  return task as NormalizedTask | null;
}

/**
 * Get multiple tasks by taskIds
 */
export async function getTasks(taskIds: string[]): Promise<NormalizedTask[]> {
  const db = await getDB();
  const tasks = await db.collection('tasks')
    .find({ taskId: { $in: taskIds } })
    .toArray();
  return tasks as NormalizedTask[];
}

/**
 * List tasks with optional filtering
 */
export async function listTasks(filters?: {
  type?: TaskType;
  isActive?: boolean;
}): Promise<NormalizedTask[]> {
  const db = await getDB();
  const query: any = {};
  
  if (filters?.type) {
    query.type = filters.type;
  }
  
  if (filters?.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  const tasks = await db.collection('tasks')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  
  return tasks as NormalizedTask[];
}

/**
 * Validate task reference exists
 */
export async function validateTaskReference(
  taskId: string,
  expectedType?: TaskType
): Promise<boolean> {
  const task = await getTask(taskId);
  if (!task) return false;
  if (expectedType && task.type !== expectedType) return false;
  return task.isActive;
}
