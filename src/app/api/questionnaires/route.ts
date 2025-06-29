import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const submittedPassword = authHeader?.split('Bearer ')[1];

    if (submittedPassword !== process.env.SURVEY_LIST_PASSWORD) {
      return NextResponse.json({ message: 'Authorization required' }, { status: 401 });
    }

    await connectToDatabase();
    const questionnaires = await Questionnaire.find({}).select('_id title description').lean();
    return NextResponse.json(questionnaires);

  } catch (_error) {
    console.error("Error fetching questionnaires:", _error);
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const plainTextPassword = crypto.randomBytes(4).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);


    const newQuestionnaire = new Questionnaire({
      ...body,
      password: hashedPassword
    });
    await newQuestionnaire.save();

    const responseData = {
      _id: newQuestionnaire._id,
      title: newQuestionnaire.title,
      password: plainTextPassword,
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("API Error creating questionnaire:", error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error creating questionnaire' }, { status: 500 });
  }
}