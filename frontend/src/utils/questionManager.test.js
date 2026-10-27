import { questionManager } from './questionManager';

const questionSets = [{
  id: 'set',
  name: 'Набор',
  enabled: true,
  subcategories: [{
    id: 'category',
    name: 'Категория',
    enabled: true,
    questions: ['Новый', 'Пропущенный', 'Обсуждённый'],
    questionIds: ['new', 'skipped', 'completed'],
    disabledQuestions: [],
  }],
}];

describe('question priority', () => {
  test('prefers a question no member has seen', () => {
    const selected = questionManager.getRandomQuestion(
      questionSets,
      { used: [], skipped: [] },
      {
        skipped: { completed_count: 0, skipped_count: 1 },
        completed: { completed_count: 1, skipped_count: 0 },
      },
    );

    expect(selected.serverQuestionId).toBe('new');
  });

  test('prefers zero completions even when it has more skips', () => {
    const selected = questionManager.getRandomQuestion(
      questionSets,
      { used: [], skipped: [] },
      {
        new: { completed_count: 2, skipped_count: 0 },
        skipped: { completed_count: 0, skipped_count: 5 },
        completed: { completed_count: 1, skipped_count: 0 },
      },
    );

    expect(selected.serverQuestionId).toBe('skipped');
  });

  test('uses fewer skips as the tie-breaker', () => {
    const selected = questionManager.getRandomQuestion(
      questionSets,
      { used: [], skipped: [] },
      {
        new: { completed_count: 1, skipped_count: 2 },
        skipped: { completed_count: 1, skipped_count: 1 },
        completed: { completed_count: 2, skipped_count: 0 },
      },
    );

    expect(selected.serverQuestionId).toBe('skipped');
  });

  test('keeps current-conversation completed questions excluded', () => {
    const selected = questionManager.getRandomQuestion(
      questionSets,
      { used: ['category_0'], skipped: [] },
      {},
    );

    expect(selected.id).not.toBe('category_0');
  });

  test('deprioritizes a skip made in the current offline session', () => {
    const selected = questionManager.getRandomQuestion(
      questionSets,
      { used: [], skipped: ['category_0'] },
      {},
    );

    expect(selected.id).not.toBe('category_0');
  });
});
