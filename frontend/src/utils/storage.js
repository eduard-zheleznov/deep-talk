// Local storage utility for DeepTalk

const STORAGE_KEYS = {
  GROUPS: 'deeptalk_groups',
  ACTIVE_GROUP: 'deeptalk_active_group',
  CATEGORIES: 'deeptalk_categories',
};

// Default categories and questions in Russian
const DEFAULT_CATEGORIES = [
  {
    id: 'relationships',
    name: 'Отношения',
    enabled: true,
    questions: [
      'Что для тебя означает настоящая дружба?',
      'Какой момент в наших отношениях был для тебя самым важным?',
      'Чему тебя научили твои прошлые отношения?',
      'Как ты понимаешь, что человек тебе действительно важен?',
      'Что ты больше всего ценишь в близких людях?',
    ],
  },
  {
    id: 'dreams',
    name: 'Мечты и цели',
    enabled: true,
    questions: [
      'О чём ты мечтал в детстве и изменились ли твои мечты?',
      'Если бы у тебя была возможность начать всё заново, что бы ты изменил?',
      'Какую цель ты хочешь достичь в ближайший год?',
      'Что бы ты сделал, если бы не боялся неудачи?',
      'Каким ты видишь себя через 10 лет?',
    ],
  },
  {
    id: 'values',
    name: 'Ценности',
    enabled: true,
    questions: [
      'Какие три ценности для тебя самые важные в жизни?',
      'Был ли момент, когда тебе пришлось выбирать между своими принципами и выгодой?',
      'Что для тебя означает успех?',
      'Как ты определяешь, правильно ли поступаешь?',
      'Какой урок жизни ты считаешь самым важным?',
    ],
  },
  {
    id: 'emotions',
    name: 'Эмоции и чувства',
    enabled: true,
    questions: [
      'Когда ты в последний раз плакал и почему?',
      'Что заставляет тебя чувствовать себя по-настоящему счастливым?',
      'Какая эмоция тебе труднее всего даётся?',
      'Как ты справляешься со стрессом и тревогой?',
      'Что ты чувствуешь, когда остаёшься наедине с собой?',
    ],
  },
  {
    id: 'memories',
    name: 'Воспоминания',
    enabled: true,
    questions: [
      'Какое твоё самое яркое воспоминание из детства?',
      'Есть ли момент в жизни, который ты бы хотел пережить снова?',
      'Что из прошлого до сих пор влияет на тебя сегодня?',
      'Какой урок ты извлёк из самой сложной ситуации в своей жизни?',
      'За что ты благодарен в своём прошлом?',
    ],
  },
];

export const storage = {
  getGroups() {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return data ? JSON.parse(data) : [];
  },

  saveGroups(groups) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  getActiveGroup() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP);
  },

  setActiveGroup(groupId) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP, groupId);
  },

  getCategories(groupId) {
    const key = `${STORAGE_KEYS.CATEGORIES}_${groupId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  },

  saveCategories(groupId, categories) {
    const key = `${STORAGE_KEYS.CATEGORIES}_${groupId}`;
    localStorage.setItem(key, JSON.stringify(categories));
  },

  getQuestionHistory(groupId) {
    const key = `deeptalk_history_${groupId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : { used: [], skipped: [] };
  },

  saveQuestionHistory(groupId, history) {
    const key = `deeptalk_history_${groupId}`;
    localStorage.setItem(key, JSON.stringify(history));
  },

  resetHistory(groupId) {
    const key = `deeptalk_history_${groupId}`;
    localStorage.setItem(key, JSON.stringify({ used: [], skipped: [] }));
  },

  clearAll() {
    localStorage.clear();
  },

  getDefaultCategories() {
    return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  },
};

export default storage;