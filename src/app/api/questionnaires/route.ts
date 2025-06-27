import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';

/**
 * GET handler to fetch all questionnaires.
 */
export async function GET() {
  try {
    await connectToDatabase();
    // Find all questionnaires, but only return essential fields for the list view
    const questionnaires = await Questionnaire.find({}).select('_id title description questions._id').lean();

    // Remap questions to just get a count
    const responseData = questionnaires.map(q => ({
      ...q,
      questions: q.questions.length
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error fetching questionnaires:", error);
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

/**
 * POST handler to create a new questionnaires.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const newQuestionnaire = new Questionnaire(body);
    const savedQuestionnaire = await newQuestionnaire.save();
    return NextResponse.json(savedQuestionnaire, { status: 201 });
  } catch (error) {
    console.error("API Error creating questionnaires:", error);
    // Provide more specific error for validation issues
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error creating questionnaires' }, { status: 500 });
  }
}
