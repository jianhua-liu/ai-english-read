/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Grade = 'Grade 6' | 'Junior High' | 'Senior High';

export interface Page {
  text: string;
  translation: string;
  grammarPoint: string;
}

export interface Book {
  id: string;
  title: string;
  grade: Grade;
  pages: Page[];
  createdAt: number;
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  example: string;
  addedAt: number;
}
