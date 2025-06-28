import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubmission extends Document {
    questionnaireId: Types.ObjectId;
    answers: Map<string, unknown>;
    submittedAt: Date;
}

const SubmissionSchema: Schema = new Schema({
    questionnaireId: { type: Schema.Types.ObjectId, ref: 'Questionnaire', required: true },
    answers: { type: Map, of: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now },
});

const Submission = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
export default Submission;