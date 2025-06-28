// app/api/questionnaires/[id]/submissions/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import Submission from '@/models/Submission';
import bcrypt from 'bcryptjs';

// Define types for better clarity
interface QuestionPassword {
  id: string;
  label: string;
  viewPassword?: string; // Add optional viewPassword if it exists on the question schema
}

interface SubmittedAnswer {
  _id: string;
  answer: unknown; // Use unknown for specific answer type as it can vary
  submittedAt: Date;
}

/**
 * POST handler to verify a password and fetch submissions for a specific question.
 */
export async function POST(
    request: Request,
    // Fix: Removed the explicit type annotation for `params`.
    // Next.js will automatically infer { questionId: string } based on the file name.
    { params }: { params: { questionId: string } }
): Promise<NextResponse> {
  try {
    const { questionId } = params;
    const { password }: { password?: string } = await request.json(); // Password might be undefined

    if (!password) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    }

    // Validate questionId as a valid ObjectId if it's expected to be
    // Based on your schema, it's a string, so no ObjectId validation here unless the intention is different.

    await connectToDatabase();

    // Find the questionnaire that contains the question, and explicitly select the password
    const questionnaire = await Questionnaire.findOne({ 'questions.id': questionId })
        .select('+questions.viewPassword') // Assuming viewPassword is a field on the question sub-document
        .lean();

    if (!questionnaire) {
      return NextResponse.json({ message: 'Question or Questionnaire not found' }, { status: 404 });
    }

    // Find the specific question within the questionnaire
    const question: QuestionPassword | undefined = questionnaire.questions.find((q: QuestionPassword) => q.id === questionId);

    if (!question || !question.viewPassword) {
      // If the question doesn't exist or isn't password-protected
      return NextResponse.json({ message: 'This question is not password-protected or does not exist' }, { status: 403 });
    }

    // Compare the provided password with the stored hash
    const isMatch: boolean = await bcrypt.compare(password, question.viewPassword);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
    }

    // If password matches, fetch all submissions for this questionnaire
    const submissions = await Submission.find({ questionnaireId: questionnaire._id }).lean();

    // Filter the submissions to get answers only for the specific question
    const relevantAnswers: SubmittedAnswer[] = submissions
        .map(sub => ({
          _id: sub._id.toString(),
          answer: (sub.answers as Map<string, unknown>).get(questionId), // Explicitly cast answers to Map
          submittedAt: sub.submittedAt,
        }))
        .filter(item => item.answer !== undefined && item.answer !== null);

    return NextResponse.json({
      questionLabel: question.label,
      answers: relevantAnswers
    });

  } catch (error: unknown) { // Explicitly type error
    console.error(`API Error fetching submissions for question ${params.questionId}:`, error);
    return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
  }
}
