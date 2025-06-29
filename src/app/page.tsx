"use client";

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';

interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  questions: number;
}

const QuestionnaireListPage: React.FC = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const fetchQuestionnaires = async (password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/questionnaires', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Incorrect password.');
        }
        throw new Error('Failed to fetch questionnaires');
      }

      const data = await res.json();
      setQuestionnaires(data);
      setIsAuthenticated(true);
      toast.success("Authentication successful!");

    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not load surveys.");
      setPasswordInput('');
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    await fetchQuestionnaires(passwordInput);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Toaster richColors />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Surveys</CardTitle>
            <CardDescription>Enter the password to view available surveys.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter access password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAuthenticating}>
                {isAuthenticating || isLoading ? "Authenticating..." : "Access Surveys"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Available Surveys
          </h1>
          <p className="text-lg text-gray-600">
            Please select a survey to begin.
          </p>
        </header>

        {questionnaires.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {questionnaires.map((q, index) => (
              <motion.div
                key={q._id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle>{q.title}</CardTitle>
                    <CardDescription>{q.questions} questions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-700">{q.description}</p>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link href={`/questionnaire/${q._id}`} passHref>
                      <Button className="w-full">
                        Start Survey <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-16">
            <p>No surveys are available at the moment. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireListPage;