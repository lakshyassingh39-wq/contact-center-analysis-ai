const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessage
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('agent', 'supervisor', 'admin').default('agent'),
    department: Joi.string().trim().optional()
  }),
  
  callMetadata: Joi.object({
    customerInfo: Joi.string().optional(),
    agentInfo: Joi.string().optional(),
    callDate: Joi.date().optional(),
    callType: Joi.string().valid('inbound', 'outbound').default('inbound')
  }),
  
  quizAnswer: Joi.object({
    questionId: Joi.string().required(),
    answer: Joi.string().required()
  }),
  
  updateProgress: Joi.object({
    type: Joi.string().valid('article', 'video', 'callExample').required(),
    resourceId: Joi.string().required()
  })
};

module.exports = { validateRequest, schemas };
