import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(
    request: Request,
    context: RouteParams
) {
    try {
        const { id } = await context.params;
        const { password } = await request.json();

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ message: 'Password required' }, { status: 400 });
        }

        await connectToDatabase();
        const questionnaire = await Questionnaire.findById(id).select('+password');
        if (!questionnaire) {
            return NextResponse.json({ message: 'Not Found' }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(password, questionnaire.password);
        if (isMatch) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 401 });
        }

    } catch (error) {
        console.error(`API Error verifying password:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}