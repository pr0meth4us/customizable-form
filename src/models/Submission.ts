import { Schema, model, models } from 'mongoose';

const submissionSchema = new Schema({
    questionnaireId: {
        type: Schema.Types.ObjectId,
        ref: 'Questionnaire',
        required: true,
    },
    answers: {
        type: Map,
        of: Schema.Types.Mixed, // Allows storing any kind of value for answers
        required: true,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
});

const Submission = models.Submission || model('Submission', submissionSchema);

export default Submission;