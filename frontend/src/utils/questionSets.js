const DEFAULT_SET_ID = 'set_default';
const DEFAULT_SET_NAME = 'Базовый набор № 1';
const DEFAULT_SUBCATEGORY_NAME = 'Общие вопросы';

const stableHash = (value) => {
  const text = String(value || '');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
};

const createEntityId = (prefix, name = '') => (
  `${prefix}_${stableHash(`${name}_${Date.now()}_${Math.random().toString(36).slice(2)}`)}`
);

const normalizeName = (name) => String(name || '').trim().toLowerCase();

const cleanQuestionText = (line) => (
  String(line || '')
    .trim()
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[\.)]\s+/, '')
    .trim()
);

export const isQuestionSet = (item) => (
  Boolean(item && (Array.isArray(item.subcategories) || item.type === 'question_set'))
);

export const getQuestionId = (subcategory, index) => `${subcategory.id}_${index}`;

export const normalizeSubcategory = (subcategory, index = 0) => {
  const questions = Array.isArray(subcategory?.questions)
    ? subcategory.questions.map((question) => String(question || '').trim()).filter(Boolean)
    : [];

  const questionIds = Array.isArray(subcategory?.questionIds)
    ? subcategory.questionIds
    : undefined;

  const disabledQuestions = Array.isArray(subcategory?.disabledQuestions)
    ? subcategory.disabledQuestions.filter((questionIndex) => Number.isInteger(questionIndex))
    : [];

  return {
    id: subcategory?.id || `subcategory_${stableHash(`${subcategory?.name || DEFAULT_SUBCATEGORY_NAME}_${index}`)}`,
    name: String(subcategory?.name || `${DEFAULT_SUBCATEGORY_NAME} ${index + 1}`).trim(),
    enabled: subcategory?.enabled !== false,
    questions,
    ...(questionIds ? { questionIds } : {}),
    disabledQuestions,
  };
};

export const normalizeQuestionSet = (questionSet, index = 0) => {
  const rawSubcategories = Array.isArray(questionSet?.subcategories)
    ? questionSet.subcategories
    : Array.isArray(questionSet?.categories)
      ? questionSet.categories
      : [];

  return {
    id: questionSet?.id || `set_${stableHash(`${questionSet?.name || DEFAULT_SET_NAME}_${index}`)}`,
    type: 'question_set',
    name: String(questionSet?.name || `${DEFAULT_SET_NAME} ${index + 1}`).trim(),
    enabled: questionSet?.enabled !== false,
    subcategories: rawSubcategories
      .map((subcategory, subcategoryIndex) => normalizeSubcategory(subcategory, subcategoryIndex))
      .filter((subcategory) => subcategory.questions.length > 0),
  };
};

export const normalizeQuestionSets = (items) => {
  const source = Array.isArray(items) ? items : [];
  if (source.length === 0) return [];

  const sets = [];
  const flatCategories = [];

  source.forEach((item) => {
    if (isQuestionSet(item)) {
      sets.push(item);
      return;
    }

    flatCategories.push(item);
  });

  const normalizedSets = sets
    .map((questionSet, index) => normalizeQuestionSet(questionSet, index))
    .filter((questionSet) => questionSet.subcategories.length > 0);

  if (flatCategories.length > 0) {
    normalizedSets.unshift({
      id: DEFAULT_SET_ID,
      type: 'question_set',
      name: DEFAULT_SET_NAME,
      enabled: true,
      subcategories: flatCategories
        .map((category, index) => normalizeSubcategory(category, index))
        .filter((subcategory) => subcategory.questions.length > 0),
    });
  }

  return normalizedSets;
};

export const getSetStats = (questionSet) => {
  const subcategories = Array.isArray(questionSet?.subcategories) ? questionSet.subcategories : [];
  const totalQuestions = subcategories.reduce((sum, subcategory) => sum + subcategory.questions.length, 0);
  const enabledQuestions = questionSet?.enabled === false
    ? 0
    : subcategories.reduce((sum, subcategory) => {
        if (subcategory.enabled === false) return sum;
        const disabledCount = (subcategory.disabledQuestions || []).length;
        return sum + Math.max(0, subcategory.questions.length - disabledCount);
      }, 0);

  return {
    subcategories: subcategories.length,
    totalQuestions,
    enabledQuestions,
  };
};

export const getQuestionSetsSummary = (questionSets) => (
  normalizeQuestionSets(questionSets).reduce((summary, questionSet) => {
    const stats = getSetStats(questionSet);
    return {
      sets: summary.sets + 1,
      subcategories: summary.subcategories + stats.subcategories,
      totalQuestions: summary.totalQuestions + stats.totalQuestions,
      enabledQuestions: summary.enabledQuestions + stats.enabledQuestions,
    };
  }, {
    sets: 0,
    subcategories: 0,
    totalQuestions: 0,
    enabledQuestions: 0,
  })
);

export const hasEnabledQuestions = (questionSets) => (
  getQuestionSetsSummary(questionSets).enabledQuestions > 0
);

export const formatRuCount = (count, forms) => {
  const absoluteCount = Math.abs(Number(count)) || 0;
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} ${forms[2]}`;
  if (lastDigit === 1) return `${count} ${forms[0]}`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} ${forms[1]}`;
  return `${count} ${forms[2]}`;
};

const shouldTreatAsHeading = (line) => (
  line.endsWith(':') &&
  line.length <= 90 &&
  !line.includes('?')
);

const buildSubcategory = (name, questions, previousSet, index) => {
  const cleanedQuestions = questions.map(cleanQuestionText).filter(Boolean);
  if (cleanedQuestions.length === 0) return null;

  const previousSubcategory = previousSet?.subcategories?.find(
    (subcategory) => normalizeName(subcategory.name) === normalizeName(name)
  );
  const preservedQuestionIds = Array.isArray(previousSubcategory?.questionIds)
    ? cleanedQuestions.map((question, questionIndex) => (
        previousSubcategory.questions?.[questionIndex] === question
          ? previousSubcategory.questionIds[questionIndex]
          : undefined
      ))
    : undefined;

  return {
    id: previousSubcategory?.id || createEntityId('subcategory', `${name}_${index}`),
    name: String(name || DEFAULT_SUBCATEGORY_NAME).trim(),
    enabled: previousSubcategory?.enabled !== false,
    questions: cleanedQuestions,
    ...(preservedQuestionIds?.some(Boolean) ? { questionIds: preservedQuestionIds } : {}),
    disabledQuestions: (previousSubcategory?.disabledQuestions || []).filter(
      (questionIndex) => questionIndex < cleanedQuestions.length
    ),
  };
};

export const parseQuestionSetText = (text, fallbackName, previousSet = null) => {
  const lines = String(text || '').split(/\r?\n/);
  let setName = String(fallbackName || previousSet?.name || 'Новый набор').trim();
  let currentSubcategoryName = '';
  let currentQuestions = [];
  const subcategories = [];

  const flushSubcategory = () => {
    const subcategory = buildSubcategory(
      currentSubcategoryName || DEFAULT_SUBCATEGORY_NAME,
      currentQuestions,
      previousSet,
      subcategories.length
    );

    if (subcategory) subcategories.push(subcategory);
    currentQuestions = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const setHeadingMatch = line.match(/^#\s+(.+)$/);
    if (setHeadingMatch) {
      setName = setHeadingMatch[1].trim();
      return;
    }

    const subcategoryHeadingMatch = line.match(/^##+\s+(.+)$/);
    if (subcategoryHeadingMatch) {
      flushSubcategory();
      currentSubcategoryName = subcategoryHeadingMatch[1].trim();
      return;
    }

    if (shouldTreatAsHeading(line)) {
      flushSubcategory();
      currentSubcategoryName = line.replace(/:$/, '').trim();
      return;
    }

    currentQuestions.push(line);
  });

  flushSubcategory();

  return {
    id: previousSet?.id || createEntityId('set', setName),
    type: 'question_set',
    name: setName,
    enabled: previousSet?.enabled !== false,
    subcategories,
  };
};

export const questionSetToText = (questionSet) => (
  normalizeQuestionSet(questionSet).subcategories
    .map((subcategory) => [
      `## ${subcategory.name}`,
      ...subcategory.questions,
    ].join('\n'))
    .join('\n\n')
);

export const flattenQuestionSets = (questionSets) => (
  normalizeQuestionSets(questionSets).flatMap((questionSet) => (
    questionSet.subcategories.map((subcategory) => ({
      ...subcategory,
      questionSetId: questionSet.id,
      questionSetName: questionSet.name,
      questionSetEnabled: questionSet.enabled,
    }))
  ))
);

export { DEFAULT_SET_ID, DEFAULT_SET_NAME, DEFAULT_SUBCATEGORY_NAME };
