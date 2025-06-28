// app/api/questionnaires/[id]/submissions/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire, { IQuestion } from '@/models/Questionnaire'; // Import IQuestion for typing nested questions
import Submission from '@/models/Submission'; // Import ISubmission for type safety
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose'; // Import Types for ObjectId

// Define types for better clarity of lean results
interface LeanQuestionnaireResult {
    _id: Types.ObjectId; // MongoDB ObjectId type for the questionnaire's ID
    questions: (IQuestion & { _id?: Types.ObjectId })[]; // Array of question sub-documents, with optional _id
    // Add other fields from IQuestionnaire here if you access them directly on `questionnaire` object
}

interface LeanSubmissionResult {
    _id: Types.ObjectId; // MongoDB ObjectId type for the submission's ID
    questionnaireId: Types.ObjectId;
    answers: Map<string, unknown>; // Answers are stored as a Map
    submittedAt: Date;
}

// Extend IQuestion to include the viewPassword property, which is selectively retrieved
interface QuestionWithPassword extends IQuestion {
    viewPassword?: string;
}

interface SubmittedAnswer {
    _id: string; // String representation of MongoDB ObjectId
    answer: unknown; // The actual answer value, type depends on question
    submittedAt: Date;
}

/**
 * POST handler to verify a password and fetch submissions for a specific question.
 */
export async function POST(
    request: Request,
    // FIX: Changed the params typing to the standard `context` object structure
    context: { params: { questionId: string } } // This is the recommended way for Next.js App Router params
): Promise<NextResponse> {
    try {
        const { questionId } = context.params; // Access questionId from context.params
        const { password }: { password?: string } = await request.json();

        if (!password) {
            return NextResponse.json({ message: 'Password is required' }, { status: 400 });
        }

        await connectToDatabase();

        const questionnaire: LeanQuestionnaireResult | null = await Questionnaire.findOne({ 'questions.id': questionId })
            .select('+questions.viewPassword')
            .lean<LeanQuestionnaireResult>();

        if (!questionnaire) {
            return NextResponse.json({ message: 'Question or Questionnaire not found' }, { status: 404 });
        }

        const question: QuestionWithPassword | undefined = questionnaire.questions.find(
            (q: IQuestion) => q.id === questionId
        ) as QuestionWithPassword;

        if (!question || !question.viewPassword) {
            return NextResponse.json({ message: 'This question is not password-protected or does not exist' }, { status: 403 });
        }

        const isMatch: boolean = await bcrypt.compare(password, question.viewPassword);

        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        }

        const submissions: LeanSubmissionResult[] = await Submission.find({ questionnaireId: questionnaire._id })
            .lean<LeanSubmissionResult[]>();

        const relevantAnswers: SubmittedAnswer[] = submissions
            .map(sub => ({
                _id: sub._id.toString(),
                answer: sub.answers.get(questionId),
                submittedAt: sub.submittedAt,
            }))
            .filter(item => item.answer !== undefined && item.answer !== null);

        return NextResponse.json({
            questionLabel: question.label,
            answers: relevantAnswers
        });

    } catch (error: unknown) {
        // Access questionId from context.params for logging as well
        console.error(`API Error fetching submissions for question ${context.params.questionId}:`, error);
        return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
    }
}
