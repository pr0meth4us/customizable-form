// app/api/questionnaires/[id]/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import { Types } from 'mongoose';

/**
 * GET handler to fetch a single questionnaire by its ID.
 */
export async function GET(
    request: Request,
    // FIX: Changed params typing to the standard `context` object structure for consistency
    context: { params: { id: string } }
) {
  try {
    const { id } = context.params; // Access id from context.params

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid Questionnaire ID format' }, { status: 400 });
    }

    await connectToDatabase();
    const questionnaire = await Questionnaire.findById(id).lean();
    if (!questionnaire) {
      return NextResponse.json({ message: 'Questionnaire not found' }, { status: 404 });
    }

    return NextResponse.json(questionnaire);
  } catch (error: unknown) {
    console.error(`API Error fetching questionnaire ${context.params.id}:`, error);
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

/**
 * PUT handler to update an existing questionnaire.
 */
export async function PUT(
    request: Request,
    // FIX: Changed params typing to the standard `context` object structure for consistency
    context: { params: { id: string } }
) {
  try {
    const { id } = context.params; // Access id from context.params

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
  } catch (error: unknown) {
    console.error(`API Error updating questionnaire ${context.params.id}:`, error);
    return NextResponse.json({ message: 'Error updating questionnaires' }, { status: 500 });
  }
}

/**
 * DELETE handler to remove a questionnaire.
 */
export async function DELETE(
    request: Request,
    // FIX: Changed params typing to the standard `context` object structure for consistency
    context: { params: { id: string } }
) {
  try {
    const { id } = context.params; // Access id from context.params

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
    console.error(`API Error deleting questionnaire ${context.params.id}:`, error);
    return NextResponse.json({ message: 'Error deleting questionnaires' }, { status: 500 });
  }
}
