import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import Submission from '@/models/Submission';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export async function GET(
    request: Request,
    { params: { id } }: { params: { id: string } }
) {
    try {
        const password = request.headers.get('Authorization')?.split('Bearer ')[1];

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid Questionnaire ID' }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
        }

        await connectToDatabase();
        // Find questionnaire and include the password for comparison
        const questionnaire = await Questionnaire.findById(id).select('+password');
        if (!questionnaire) {
            return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
        }

        // Verify password by comparing the hash
        const isMatch = await bcrypt.compare(password, questionnaire.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // If password is correct, fetch submissions
        const submissions = await Submission.find({ questionnaireId: id }).lean();
        // Convert Map to Object for each submission's answers for easier frontend handling
        const responseData = submissions.map(sub => ({
            ...sub,
            // Safely convert answers (which might be a Map or a plain object from .lean()) to a plain object
            answers: sub.answers ? Object.fromEntries(Object.entries(sub.answers)) : {}
        }));
        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`API Error fetching submissions for ${id}:`, error);
        return NextResponse.json({ message: 'Error fetching submissions' }, { status: 500 });
    }
}