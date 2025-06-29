import mongoose, { Schema, model, models } from 'mongoose';

export interface IQuestion {
  id: string;
  label: string;
  options?: string[];
  type: 'radio' | 'text' | 'image-select';
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
  viewPassword?: string;
  imageUrl?: string; // NEW: Optional image for any question
  reasons?: string[]; // NEW: Optional custom reasons for image-select
}

const questionSchema = new Schema<IQuestion>({
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
  imageUrl: String, // NEW: Added to schema
  reasons: [String], // NEW: Added to schema
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
  password: {
    type: String,
    required: true,
    select: false,
  },
  layout: {
    type: String,
    enum: ['multi-page.tsx', 'single-page.tsx'],
    default: 'multi-page.tsx',
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Questionnaire = models.Questionnaire || model('Questionnaire', questionnaireSchema);
export default Questionnaire;