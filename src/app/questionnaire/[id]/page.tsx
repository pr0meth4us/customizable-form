"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  layout: 'multi-page' | 'single-page'; // Ensure layout is part of the interface
  questions: { id: string }[];
}

const StartSurveyPage: React.FC = () => {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (id) {
      const fetchQuestionnaire = async () => {
        try {
          const res = await fetch(`/api/questionnaires/${id}`);
          if (!res.ok) {
            throw new Error('Could not fetch questionnaire details.');
          }
          const data = await res.json();
          setQuestionnaire(data);
        } catch (error) {
          console.error(error);
          toast.error('Failed to load survey.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchQuestionnaire();
    }
  }, [id]);

  /**
   * =================================================================
   * MODIFIED CODE: This function now checks the survey layout.
   * =================================================================
   * REASON: The original code always redirected to the multi-page
   * format. This version reads the `layout` property and routes to
   * '/all' for single-page surveys.
   * =================================================================
   */
  const handleStart = () => {
    if (questionnaire && questionnaire.questions.length > 0) {
      // Check the layout property of the questionnaire
      if (questionnaire.layout === 'single-page') {
        // If layout is 'single-page', redirect to the 'all' questions page
        router.push(`/questionnaire/${id}/all`);
      } else {
        // Otherwise, proceed with the default multi-page layout
        const firstQuestionId = questionnaire.questions[0].id;
        router.push(`/questionnaire/${id}/${firstQuestionId}`);
      }
    } else {
      toast.error("This survey has no questions.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading survey...</div>;
  }

  if (!questionnaire) {
    return <div className="min-h-screen flex items-center justify-center">Survey not found.</div>;
  }

  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster />
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{questionnaire.title}</CardTitle>
            <CardDescription className="text-lg pt-2">{questionnaire.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-8">This survey contains {questionnaire.questions.length} questions. Please answer them to the best of your ability.</p>
            <Button size="lg" onClick={handleStart}>
              Begin Survey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
  );
};

export default StartSurveyPage;