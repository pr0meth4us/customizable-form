"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ImageSelector } from '@/app/components/ImageSelector';
// MODIFICATION: Import Textarea
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Question {
  id: string;
  label: string;
  options: string[];
  type: 'radio' | 'text' | 'image-select';
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
}

interface Questionnaire {
  _id: string;
  title: string;
  questions: Question[];
}

const QuestionPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { id: questionnaireId, questionId } = params as { id: string, questionId: string };
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (questionnaireId) {
      try {
        const res = await fetch(`/api/questionnaires/${questionnaireId}`);
        if (!res.ok) throw new Error("Survey not found");
        const data = await res.json();
        setQuestionnaire(data);

        const savedAnswers = localStorage.getItem(`answers-${questionnaireId}`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
      } catch (error) {
        toast.error("Failed to load survey data.");
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
  }, [questionnaireId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (questionnaire) {
      const qIndex = questionnaire.questions.findIndex(q => q.id === questionId);
      setCurrentQuestionIndex(qIndex);
      if (qIndex !== -1) {
        setCurrentQuestion(questionnaire.questions[qIndex]);
      } else if (!isLoading) {
        toast.error("Question not found.");
        router.push(`/questionnaire/${questionnaireId}`);
      }
    }
  }, [questionnaire, questionId, router, isLoading, questionnaireId]);

  const handleAnswerChange = (qId: string, value: any) => {
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);
    localStorage.setItem(`answers-${questionnaireId}`, JSON.stringify(newAnswers));
  };

  const navigateToQuestion = (direction: 'next' | 'prev') => {
    if (!questionnaire) return;
    const newIndex = direction === 'next' ? currentQuestionIndex + 1 : currentQuestionIndex - 1;
    if (newIndex >= 0 && newIndex < questionnaire.questions.length) {
      const nextQuestionId = questionnaire.questions[newIndex].id;
      router.push(`/questionnaire/${questionnaireId}/${nextQuestionId}`);
    } else if (direction === 'next') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    toast.info("Submitting your answers, please wait...");
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

      toast.success("Survey completed! Thank you for your time.");
      localStorage.removeItem(`answers-${questionnaireId}`);
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }

  if (isLoading || !currentQuestion) {
    return <div className="min-h-screen flex items-center justify-center">Loading question...</div>;
  }

  const progressValue = questionnaire ? ((currentQuestionIndex + 1) / questionnaire.questions.length) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === (questionnaire?.questions.length ?? 0) - 1;

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Toaster />
        <Card className="w-full max-w-3xl animate-fade-in">
          <CardHeader>
            <Progress value={progressValue} className="mb-4" />
            <CardTitle className="text-2xl">{currentQuestion.label}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === 'radio' && (
                <div className="flex flex-col space-y-2">
                  {currentQuestion.options.map(option => (
                      <label key={option} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-100 cursor-pointer transition-colors has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400">
                        <input
                            type="radio"
                            name={currentQuestion.id}
                            value={option}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            checked={answers[currentQuestion.id] === option}
                            className="form-radio text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>{option}</span>
                      </label>
                  ))}
                </div>
            )}
            {/*
            * =================================================================
            * MODIFIED CODE: Added this block to render text inputs.
            * =================================================================
          */}
            {currentQuestion.type === 'text' && (
                <Textarea
                    placeholder="Your answer..."
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    value={answers[currentQuestion.id] || ''}
                />
            )}
            {currentQuestion.type === 'image-select' && currentQuestion.imageOptions && (
                <ImageSelector
                    title=""
                    instructions={currentQuestion.instructions || ''}
                    options={currentQuestion.imageOptions}
                    singleSelect
                    onSelectionComplete={(selection) => handleAnswerChange(currentQuestion.id, selection)}
                    labels={currentQuestion.imageLabels}
                />
            )}
          </CardContent>
        </Card>
        <div className="flex justify-between w-full max-w-3xl mt-6">
          <Button variant="outline" onClick={() => navigateToQuestion('prev')} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          <Button onClick={() => navigateToQuestion('next')}>
            {isLastQuestion ? 'Submit' : 'Next'}
            {isLastQuestion ? <CheckCircle className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
  );
};

export default QuestionPage;