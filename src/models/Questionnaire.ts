import mongoose, { Schema, model, models } from 'mongoose';

// Define the schema for a single question
const questionSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true, // Each question ID within a survey should be unique
    default: () => new mongoose.Types.ObjectId().toHexString()
  },
  label: { type: String, required: true },
  options: [{ type: String }], // Options are not required for all types (e.g., text)
  type: {
    type: String,
    enum: ['radio', 'text', 'image-select'],
    required: true,
    default: 'radio'
  },
  // Optional fields for 'image-select' type
  instructions: String,
  imageOptions: [String], // Stores image URLs
  imageLabels: [String],  // Corresponding labels for the images
});

// Define the main schema for the questionnaire
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
  layout: {
    type: String,
    enum: ['multi-page', 'single-page'],
    default: 'multi-page', // Default to one question per page
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// To prevent model overwrite errors in Next.js hot-reloading environments
const Questionnaire = models.Questionnaire || model('Questionnaire', questionnaireSchema);

export default Questionnaire;
