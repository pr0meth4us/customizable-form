
import mongoose, { Schema, model, models } from 'mongoose';

const questionSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toHexString()
  },
  label: { type: String, required: true },
  options: [{ type: String }],
  type: {
    type: String,
    enum: ['radio', 'text', 'image-select'],
    required: true,
    default: 'radio'
  },
  instructions: String,
  imageOptions: [String],
  imageLabels: [String],
});

const questionnaireSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Questionnaire title is required.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // NEW: Password field for viewing submissions
  password: {
    type: String,
    required: true,
    select: false, // Don't include password in general queries
  },
  layout: {
    type: String,
    enum: ['multi-page', 'single-page'],
    default: 'multi-page',
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Questionnaire = models.Questionnaire || model('Questionnaire', questionnaireSchema);
export default Questionnaire;