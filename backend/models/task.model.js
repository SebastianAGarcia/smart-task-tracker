// TASK MODEL
// This file is ready for changing to fit the backend

const taskFields = {
  title: 'string',
  description: 'string',
  priority: 'string',
  status: 'string',
  dueDate: 'string | null',
  createdAt: 'date',
  updatedAt: 'date'
};

function createTask(input = {}) {
  return {
    title: input.title || '',
    description: input.description || '',
    priority: input.priority || 'Medium',
    status: input.status || 'Pending',
    dueDate: input.dueDate || null
  };
}

function validateTask(input = {}) {
  const errors = [];

  if (!input.title || String(input.title).trim() === '') {
    errors.push('Title is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  taskFields,
  createTask,
  validateTask
};
