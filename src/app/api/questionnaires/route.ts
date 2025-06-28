import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire, { IQuestion } from '@/models/Questionnaire';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

interface IncomingQuestionnaireBody {
  title: string;
  description: string;
  layout: 'multi-page' | 'single-page';
  questions: Array<Omit<IQuestion, '_id' | 'viewPassword'>>;
}

interface CreatedQuestionnaireResponse {
  _id: string;
  title: string;
  password: string;
}

interface LeanQuestionnaireForGet {
  _id: Types.ObjectId;
  title: string;
  description: string;
  questions: IQuestion[];
}

export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();
    const questionnaires: LeanQuestionnaireForGet[] = await Questionnaire.find({})
        .select('_id title description questions')
        .lean<LeanQuestionnaireForGet[]>();

    const formattedQuestionnaires = questionnaires.map(q => ({
      _id: q._id.toString(),
      title: q.title,
      description: q.description,
      questions: Array.isArray(q.questions) ? q.questions.length : 0,
    }));

    return NextResponse.json(formattedQuestionnaires);
  } catch (error: unknown) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: IncomingQuestionnaireBody = await request.json();
    await connectToDatabase();

    const plainTextPassword = crypto.randomBytes(4).toString('hex');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

    const newQuestionnaire = new Questionnaire({
      ...body,
      password: hashedPassword,
      questions: body.questions.map(q => ({
        ...q,
      })),
    });
    await newQuestionnaire.save();

    const responseData: CreatedQuestionnaireResponse = {
      _id: newQuestionnaire._id.toString(),
      title: newQuestionnaire.title,
      password: plainTextPassword,
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    console.error('API Error creating questionnaire:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error creating questionnaire' }, { status: 500 });
  }
}