import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import { Types } from 'mongoose';

export async function GET(
    request: Request,
    { params: { id } }: { params: { id: string } } // Keep this structure, just remove the `: { params: { id: string } }`
) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Questionnaire ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const questionnaire = await Questionnaire.findById(id).lean();
    if (!questionnaire) {
      return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
    }

    return NextResponse.json(questionnaire);
  } catch (error: unknown) { // Explicitly type error as unknown for safety
    console.error(`API Error fetching questionnaire ${id}:`, error);
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

export async function PUT(
    request: Request,
    { params: { id } }: { params: { id: string } } // Keep this structure, just remove the `: { params: { id: string } }`
) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Questionnaire ID' }, { status: 400 });
    }
    const body = await request.json();
    await connectToDatabase();
    const updatedQuestionnaire = await Questionnaire.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updatedQuestionnaire) {
      return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
    }

    return NextResponse.json(updatedQuestionnaire);
  } catch (error: unknown) { // Explicitly type error as unknown
    console.error(`API Error updating questionnaire ${id}:`, error);
    return NextResponse.json({ message: 'Error updating questionnaires' }, { status: 500 });
  }
}

export async function DELETE(
    request: Request,
    { params: { id } }: { params: { id: string } }
) {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Questionnaire ID' }, { status: 400 });
    }
    await connectToDatabase();
    const deletedQuestionnaire = await Questionnaire.findByIdAndDelete(id);
    if (!deletedQuestionnaire) {
      return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Questionnaire deleted successfully' });
  } catch(error: unknown) {
    console.error(`API Error deleting questionnaire ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting questionnaires' }, { status: 500 });
  }
}
