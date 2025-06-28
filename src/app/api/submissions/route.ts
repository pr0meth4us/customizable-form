import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Submission from '@/models/Submission';
import Questionnaire from '@/models/Questionnaire'; // To validate questionnaire exists
import { Types } from 'mongoose';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { questionnaireId, answers } = body;

        if (!questionnaireId || !answers || !Types.ObjectId.isValid(questionnaireId)) {
            return NextResponse.json({ message: 'A valid questionnaireId and answers object are required' }, { status: 400 });
        }

        await connectToDatabase();

        // Optional: Verify that the questionnaire exists before saving a submission
        const questionnaire = await Questionnaire.findById(questionnaireId);
        if (!questionnaire) {
            return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
        }

        // Convert the plain JavaScript object from the request body into a Map,
        // which is the format expected by our Mongoose schema.
        const answersMap = new Map(Object.entries(answers));

        const newSubmission = new Submission({
            questionnaireId,
            answers: answersMap,
        });

        await newSubmission.save();

        return NextResponse.json({ message: 'Submission saved successfully' }, { status: 201 });
    } catch (error) {
        console.error("API Error creating submission:", error);
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json({ message: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error creating submission' }, { status: 500 });
    }
}
