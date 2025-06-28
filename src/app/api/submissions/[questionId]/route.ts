import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import Submission from '@/models/Submission';
import bcrypt from 'bcryptjs';

/**
 * POST handler to verify a password and fetch submissions for a specific question.
 */
export async function POST(
    request: Request,
    { params }: { params: { questionId: string } }
) {
    try {
        const { questionId } = params;
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ message: 'Password is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Find the questionnaire that contains the question, and explicitly select the password
        const questionnaire = await Questionnaire.findOne({ 'questions.id': questionId })
            .select('+questions.viewPassword')
            .lean();

        if (!questionnaire) {
            return NextResponse.json({ message: 'Question not found' }, { status: 404 });
        }

        // Find the specific question within the questionnaire
        const question = questionnaire.questions.find(q => q.id === questionId);

        if (!question || !question.viewPassword) {
            return NextResponse.json({ message: 'This question is not password-protected' }, { status: 403 });
        }

        // Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, question.viewPassword);

        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        }

        // If password matches, fetch all submissions for this questionnaire
        const submissions = await Submission.find({ questionnaireId: questionnaire._id }).lean();

        // Filter the submissions to get answers only for the specific question
        const relevantAnswers = submissions
            .map(sub => ({
                _id: sub._id,
                answer: sub.answers.get(questionId), // Get the specific answer from the Map
                submittedAt: sub.submittedAt,
            }))
            .filter(item => item.answer !== undefined && item.answer !== null);

        return NextResponse.json({
            questionLabel: question.label,
            answers: relevantAnswers
        });

    } catch (error) {
        console.error(`API Error fetching submissions for question ${params.questionId}:`, error);
        return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
    }
}