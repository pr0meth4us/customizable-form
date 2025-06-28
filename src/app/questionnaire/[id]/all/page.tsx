// src/app/questionnaire/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ImageSelector } from '@/app/components/ImageSelector';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Question {
  id: string;
  label: string;
  options?: string[];
  type: 'radio' | 'text' | 'image-select';
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
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (questionnaireId) {
      try {
        const res = await fetch(`/api/questionnaires/${questionnaireId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data = await res.json();
        setQuestionnaire(data);
      } catch (error) {
        toast.error("Failed to load survey data.", error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
  }, [questionnaireId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAnswerChange = (qId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
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
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit survey.");
      }

      toast.success("Survey submitted! Thank you.");
      // Redirect to the thank you page
      setTimeout(() => router.push('/thank-you'), 2000); // MODIFIED LINE

    } catch (error) {
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

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {questionnaire.questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>{index + 1}. {question.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {question.type === 'radio' && question.options && (
                  <div className="flex flex-col space-y-2">
                    {question.options.map(option => (
                      <label key={option} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-100 cursor-pointer transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                        <input type="radio" required name={question.id} value={option} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="form-radio text-blue-600"/>
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'text' && (
                  <Textarea required placeholder="Your answer..." onChange={(e) => handleAnswerChange(question.id, e.target.value)} />
                )}
                {question.type === 'image-select' && question.imageOptions && (
                  <ImageSelector
                    title=""
                    instructions={question.instructions || ''}
                    options={question.imageOptions}
                    singleSelect
                    onSelectionComplete={(selection) => handleAnswerChange(question.id, selection)}
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