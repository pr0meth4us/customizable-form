import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import Submission from '@/models/Submission';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: Request,
    context: RouteParams
) {
    try {
        const { id } = await context.params;
        const password = request.headers.get('Authorization')?.split('Bearer ')[1];

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid Questionnaire ID' }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        await connectToDatabase();
        const questionnaire = await Questionnaire.findById(id).select('+password');
        if (!questionnaire) {
            return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(password, questionnaire.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const submissions = await Submission.find({ questionnaireId: id }).lean();
        const responseData = submissions.map(sub => ({
            ...sub,
            answers: sub.answers ? Object.fromEntries(Object.entries(sub.answers)) : {}
        }));
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`API Error fetching submissions:`, error);
        return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
    }
}
