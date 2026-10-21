import {
  getQuestionId,
  normalizeQuestionSets,
  parseQuestionSetText,
} from './questionSets';

// Question management logic

export const questionManager = {
  // Get available questions based on selected sets, subcategories and history
  getAvailableQuestions(questionSets, history) {
    const availableQuestions = [];

    normalizeQuestionSets(questionSets).forEach((questionSet) => {
      if (questionSet.enabled === false) return;

      questionSet.subcategories.forEach((subcategory) => {
        if (subcategory.enabled === false || !subcategory.questions) return;

        const disabledQuestions = subcategory.disabledQuestions || [];

        subcategory.questions.forEach((question, index) => {
          const questionId = getQuestionId(subcategory, index);
          
          // Only include if not marked as used
          if (!history.used.includes(questionId) && !disabledQuestions.includes(index)) {
            availableQuestions.push({
              id: questionId,
              text: question,
              setId: questionSet.id,
              questionSetId: questionSet.id,
              questionSetName: questionSet.name,
              categoryId: subcategory.id,
              subcategoryId: subcategory.id,
              categoryName: subcategory.name,
              subcategoryName: subcategory.name,
              serverQuestionId: subcategory.questionIds?.[index],
              index,
            });
          }
        });
      });
    });
    
    return availableQuestions;
  },

  // Get a random question from available questions
  getRandomQuestion(questionSets, history) {
    const available = this.getAvailableQuestions(questionSets, history);
    
    if (available.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  },

  // Mark question as used
  markAsUsed(questionId, history) {
    if (!history.used.includes(questionId)) {
      return {
        ...history,
        used: [...history.used, questionId],
        skipped: history.skipped.filter(id => id !== questionId),
      };
    }
    return history;
  },

  // Mark question as skipped
  markAsSkipped(questionId, history) {
    if (!history.skipped.includes(questionId) && !history.used.includes(questionId)) {
      return {
        ...history,
        skipped: [...history.skipped, questionId],
      };
    }
    return history;
  },

  // Unmark question (remove from used/skipped)
  unmarkQuestion(questionId, history) {
    return {
      used: history.used.filter(id => id !== questionId),
      skipped: history.skipped.filter(id => id !== questionId),
    };
  },

  // Get question status
  getQuestionStatus(questionId, history) {
    if (history.used.includes(questionId)) return 'used';
    if (history.skipped.includes(questionId)) return 'skipped';
    return 'new';
  },

  // Parse Excel data (simple CSV format)
  parseExcelData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const categories = {};
    
    lines.forEach(line => {
      const [category, question] = line.split('\t').map(s => s.trim());
      if (category && question) {
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(question);
      }
    });
    
    const subcategories = Object.keys(categories).map((name, index) => ({
      id: `custom_${index}_${Date.now()}`,
      name,
      enabled: true,
      questions: categories[name],
      disabledQuestions: [],
    }));

    return [{
      id: `set_custom_${Date.now()}`,
      type: 'question_set',
      name: 'Импортированный набор',
      enabled: true,
      subcategories,
    }];
  },

  parseQuestionSetData(text, fallbackName, previousSet) {
    return parseQuestionSetText(text, fallbackName, previousSet);
  },
};

export default questionManager;
