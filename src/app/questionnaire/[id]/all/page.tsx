"use client";

import React, {useState, useEffect, useCallback, ChangeEvent, FormEvent} from 'react'; // Added ChangeEvent
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ImageSelector } from '@/app/components/ImageSelector';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface ImageSelectionResult {
  image: string | null;
  reasons: string[];
  customReason?: string;
}

type QuestionType = 'radio' | 'text' | 'image-select';

interface Question {
  id: string;
  label: string;
  options?: string[];
  type: QuestionType;
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
}

interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
}

const AllQuestionsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { id: questionnaireId } = params as { id: string };

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | ImageSelectionResult>>({}); // More specific type for answers
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    if (questionnaireId) {
      try {
        const res = await fetch(`/api/questionnaires/${questionnaireId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data: Questionnaire = await res.json();
        setQuestionnaire(data);
      } catch (error: unknown) {
        console.error("Failed to load survey data:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load survey data.");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
  }, [questionnaireId, router]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleAnswerChange = (qId: string, value: string | ImageSelectionResult): void => { // Explicitly type value
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    toast.info("Submitting your survey, please wait...");

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaireId: questionnaireId,
          answers: answers,
        }),
      });

      if (!res.ok) {
        const errorData: { message?: string } = await res.json();
        throw new Error(errorData.message || "Failed to submit survey.");
      }

      toast.success("Survey submitted! Thank you.");
      setTimeout(() => router.push('/thank-you'), 2000);

    } catch (error: unknown) {
      console.error("Submission Error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }


  if (isLoading || !questionnaire) {
    return <div className="min-h-screen flex items-center justify-center">Loading survey...</div>;
  }

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
        <Toaster />
        <div className="w-full max-w-4xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold">{questionnaire.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">{questionnaire.description}</p>
          </header>

          <form onSubmit={(e: FormEvent) => { e.preventDefault(); void handleSubmit(); }} className="space-y-6"> {/* Add void operator */}
            {questionnaire.questions.map((question: Question, index: number) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle>{index + 1}. {question.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {question.type === 'radio' && question.options && (
                        <div className="flex flex-col space-y-2">
                          {question.options.map((option: string) => (
                              <label key={option} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-100 cursor-pointer transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                                <input type="radio" required name={question.id} value={option} onChange={(e: ChangeEvent<HTMLInputElement>) => handleAnswerChange(question.id, e.target.value)} className="form-radio text-blue-600"/>
                                <span>{option}</span>
                              </label>
                          ))}
                        </div>
                    )}
                    {question.type === 'text' && (
                        <Textarea required placeholder="Your answer..." onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(question.id, e.target.value)} />
                    )}
                    {question.type === 'image-select' && question.imageOptions && (
                        <ImageSelector
                            title=""
                            instructions={question.instructions || ''}
                            options={question.imageOptions}
                            singleSelect
                            onSelectionComplete={(selection: ImageSelectionResult) => handleAnswerChange(question.id, selection)}
                            labels={question.imageLabels}
                        />
                    )}
                  </CardContent>
                </Card>
            ))}
            <div className="flex justify-center mt-8">
              <Button size="lg" type="submit">
                Submit Survey <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default AllQuestionsPage;