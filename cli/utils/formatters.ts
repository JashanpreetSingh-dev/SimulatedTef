/**
 * Output formatting utilities for CLI
 */

import { ReadingTask } from '../../types';
import { MockExamDocument } from '../../server/models/MockExam';

/**
 * Format output as JSON
 */
export function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format reading task as table row
 */
export function formatReadingTaskTable(tasks: ReadingTask[]): void {
  if (tasks.length === 0) {
    console.log('No reading tasks found.');
    return;
  }

  console.table(
    tasks.map(task => ({
      'Task ID': task.taskId,
      'Prompt': task.prompt.substring(0, 50) + '...',
      'Time Limit': `${task.timeLimitSec}s`,
      'Active': task.isActive ? 'Yes' : 'No',
      'Created': new Date(task.createdAt).toLocaleDateString()
    }))
  );
}

/**
 * Format mock exam as table row
 */
export function formatMockExamTable(exams: MockExamDocument[]): void {
  if (exams.length === 0) {
    console.log('No mock exams found.');
    return;
  }

  console.table(
    exams.map(exam => ({
      'Mock Exam ID': exam.mockExamId,
      'Name': exam.name,
      'Oral A': exam.oralATaskId,
      'Oral B': exam.oralBTaskId,
      'Reading': exam.readingTaskId,
      'Listening': exam.listeningTaskId,
      'Active': exam.isActive ? 'Yes' : 'No',
      'Created': new Date(exam.createdAt).toLocaleDateString()
    }))
  );
}

/**
 * Pretty print reading task details
 */
export function printReadingTaskDetails(task: ReadingTask): void {
  console.log('\n📖 Reading Task Details');
  console.log('═'.repeat(50));
  console.log(`Task ID:        ${task.taskId}`);
  console.log(`Type:           ${task.type}`);
  console.log(`Prompt:         ${task.prompt}`);
  console.log(`Content:        ${task.content.substring(0, 100)}...`);
  console.log(`Time Limit:     ${task.timeLimitSec}s (${Math.floor(task.timeLimitSec / 60)} minutes)`);
  console.log(`Active:         ${task.isActive ? 'Yes' : 'No'}`);
  console.log(`Created:        ${new Date(task.createdAt).toLocaleString()}`);
  console.log(`Updated:        ${new Date(task.updatedAt).toLocaleString()}`);
  console.log('═'.repeat(50));
}

/**
 * Pretty print mock exam details
 */
export function printMockExamDetails(exam: MockExamDocument): void {
  console.log('\n📝 Mock Exam Details');
  console.log('═'.repeat(50));
  console.log(`Mock Exam ID:   ${exam.mockExamId}`);
  console.log(`Name:           ${exam.name}`);
  if (exam.description) {
    console.log(`Description:    ${exam.description}`);
  }
  console.log(`Oral A Task:    ${exam.oralATaskId}`);
  console.log(`Oral B Task:    ${exam.oralBTaskId}`);
  console.log(`Reading Task:   ${exam.readingTaskId}`);
  console.log(`Listening Task: ${exam.listeningTaskId}`);
  console.log(`Active:         ${exam.isActive ? 'Yes' : 'No'}`);
  console.log(`Created:        ${new Date(exam.createdAt).toLocaleString()}`);
  console.log(`Updated:        ${new Date(exam.updatedAt).toLocaleString()}`);
  console.log('═'.repeat(50));
}

/**
 * Format questions list
 */
export function formatQuestionsTable(questions: any[]): void {
  if (questions.length === 0) {
    console.log('No questions found.');
    return;
  }

  console.table(
    questions.map(q => ({
      'Question #': q.questionNumber,
      'Question': q.question.substring(0, 50) + '...',
      'Correct': q.correctAnswer + 1, // Display as 1-4 instead of 0-3
      'Active': q.isActive ? 'Yes' : 'No'
    }))
  );
}
