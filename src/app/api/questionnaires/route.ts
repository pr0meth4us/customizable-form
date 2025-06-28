import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Questionnaire from '@/models/Questionnaire';
import crypto from 'crypto'; // For password generation
import bcrypt from 'bcryptjs';

// GET all questionnaires (no changes)
export async function GET() {
  try {
    await connectToDatabase();
    const questionnaires = await Questionnaire.find({}).select('_id title description').lean();
    return NextResponse.json(questionnaires);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching questionnaires' }, { status: 500 });
  }
}

// POST a new questionnaire
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectToDatabase();

    // Generate a simple, human-readable password
    const plainTextPassword = crypto.randomBytes(4).toString('hex'); // This is the password the user will see once.

    // === START MODIFICATION ===
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);
    // === END MODIFICATION ===


    const newQuestionnaire = new Questionnaire({
      ...body,
      // Save the HASHED password, not the plaintext one
      password: hashedPassword
    });
    await newQuestionnaire.save();

    // Return the saved object, but send the PLAINTEXT password back for one-time display
    const responseData = {
      _id: newQuestionnaire._id,
      title: newQuestionnaire.title,
      password: plainTextPassword, // Send the original password back to the creator
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