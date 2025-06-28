import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Submission from '@/models/Submission';
import Questionnaire from '@/models/Questionnaire';
import { Types } from 'mongoose';

interface IncomingSubmissionBody {
    questionnaireId: string;
    answers: Record<string, unknown>;
}

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body: IncomingSubmissionBody = await request.json();
        const { questionnaireId, answers } = body;

        if (!questionnaireId || typeof answers !== 'object' || answers === null || !Types.ObjectId.isValid(questionnaireId)) {
            return NextResponse.json({ message: 'A valid questionnaireId and answers object are required' }, { status: 400 });
        }

        await connectToDatabase();

        const questionnaire = await Questionnaire.findById(questionnaireId);
        if (!questionnaire) {
            return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
        }

        const answersMap = new Map<string, unknown>(Object.entries(answers));
        const newSubmission = new Submission({
            questionnaireId,
            answers: answersMap,
        });

        await newSubmission.save();

        return NextResponse.json({ message: 'Submission saved successfully' }, { status: 201 });
    } catch (error: unknown) {
        console.error("API Error creating submission:", error);
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error creating submission' }, { status: 500 });
    }
}