import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// --- Configuration ---
// Make sure this matches your db.ts and environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://phearaneronsoeung:gOaWcAmivfzYluYr@grouper.6mgw5.mongodb.net/questionnaire_db?retryWrites=true&w=majority&appName=grouper';
const MONGODB_DB = process.env.MONGODB_DB || 'questionnaire_db';

// --- Dummy Data ---
const dummyQuestionnaire = {
  title: "Customer Feedback Survey",
  description: "Thank you for taking the time to provide your feedback. Your input is valuable to us and will help improve our services.",
  questions: [
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      label: "How would you rate your overall experience with our service?",
      type: "radio",
      options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      label: "Which of these words would you use to describe our product?",
      type: "radio",
      options: ["Reliable", "High-quality", "Useful", "Overpriced", "Impractical"],
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      label: "How likely are you to recommend our company to a friend or colleague?",
      type: "radio",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"],
    },
    {
      id: new mongoose.Types.ObjectId().toHexString(),
      label: "What was the primary reason for your visit today?",
      type: "text",
      options: [] // Text questions don't have predefined options
    }
  ]
};


/**
 * Seeds the database with initial data.
 */
async function seedDB() {
  let client: MongoClient | null = null;
  try {
    console.log(`Attempting to connect to the database at ${MONGODB_URI}...`);
    client = await MongoClient.connect(MONGODB_URI);

    console.log(`✅ Successfully connected to MongoDB at ${MONGODB_URI}`);

    const db = client.db(MONGODB_DB);
    const collection = db.collection('questionnaires');

    console.log(`Operating on database: "${MONGODB_DB}"`);
    console.log('Clearing existing questionnaires...');
    await collection.deleteMany({});

    console.log('Inserting dummy questionnaires...');
    await collection.insertOne(dummyQuestionnaire);

    console.log('✅ Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding the database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// --- Execute the script ---
seedDB();
