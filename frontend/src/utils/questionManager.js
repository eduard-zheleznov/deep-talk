// Question management logic

export const questionManager = {
  // Get available questions based on selected categories and history
  getAvailableQuestions(categories, history) {
    const availableQuestions = [];
    
    categories.forEach(category => {
      if (category.enabled && category.questions) {
        category.questions.forEach((question, index) => {
          const questionId = `${category.id}_${index}`;
          
          // Only include if not marked as used
          if (!history.used.includes(questionId)) {
            availableQuestions.push({
              id: questionId,
              text: question,
              categoryId: category.id,
              categoryName: category.name,
              index,
            });
          }
        });
      }
    });
    
    return availableQuestions;
  },

  // Get a random question from available questions
  getRandomQuestion(categories, history) {
    const available = this.getAvailableQuestions(categories, history);
    
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
    
    // Convert to category format
    return Object.keys(categories).map((name, index) => ({
      id: `custom_${index}_${Date.now()}`,
      name,
      enabled: true,
      questions: categories[name],
    }));
  },
};

export default questionManager;