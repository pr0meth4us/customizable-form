import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire, { IQuestion } from '@/models/Questionnaire';
import Submission from '@/models/Submission';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

interface LeanQuestionnaireResult {
    _id: Types.ObjectId;
    questions: (IQuestion & { _id?: Types.ObjectId })[];
}

interface LeanSubmissionResult {
    _id: Types.ObjectId;
    questionnaireId: Types.ObjectId;
    answers: Map<string, unknown>;
    submittedAt: Date;
}

interface QuestionWithPassword extends IQuestion {
    viewPassword?: string;
}

interface SubmittedAnswer {
    _id: string;
    answer: unknown;
    submittedAt: Date;
}

export async function POST(
    request: Request,
    { params }: { params: { questionId: string } }
): Promise<NextResponse> {
    try {
        const { questionId } = params;
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
            .filter(item => item.answer !== undefined && item.answer !== null); // Filter out entries without an answer for this question

        return NextResponse.json({
            questionLabel: question.label,
            answers: relevantAnswers
        });

    } catch (error: unknown) {
        console.error(`API Error fetching submissions for question ${params.questionId}:`, error);
        return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
    }
}
