import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  label: string;
  type: 'radio' | 'text' | 'image-select';
  options?: string[];
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
  viewPassword?: string;
}

export interface IQuestionnaire extends Document {
  title: string;
  description: string;
  layout: 'multi-page' | 'single-page';
  questions: IQuestion[];
  password?: string; // Hashed password
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  options: [{ type: String }],
  instructions: { type: String },
  imageOptions: [{ type: String }],
  imageLabels: [{ type: String }],
  viewPassword: { type: String, select: false },
});

const QuestionnaireSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  layout: { type: String, enum: ['multi-page', 'single-page'], default: 'single-page' },
  questions: [QuestionSchema],
  password: { type: String, select: false },
  createdAt: { type: Date, default: Date.now },
});

const Questionnaire = mongoose.models.Questionnaire || mongoose.model<IQuestionnaire>('Questionnaire', QuestionnaireSchema);
export default Questionnaire;