"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toaster, toast } from 'sonner';

interface Answer {
    _id: string;
    answer: any;
    submittedAt: string;
}

const SubmissionViewerPage: React.FC = () => {
    const params = useParams();
    const { questionId } = params as { questionId: string };

    const [password, setPassword] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [questionLabel, setQuestionLabel] = useState('');

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        toast.info("Verifying password...");

        try {
            const res = await fetch(`/api/submissions/${questionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed.');
            }

            toast.success("Verification successful!");
            setAnswers(data.answers);
            setQuestionLabel(data.questionLabel);
            setIsVerified(true);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerified) {
        return (
            <div className="container mx-auto p-8">
                <Toaster />
                <Card>
                    <CardHeader>
                        <CardTitle>Submissions for: "{questionLabel}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {answers.length > 0 ? (
                            <ul className="space-y-4">
                                {answers.map((item) => (
                                    <li key={item._id} className="border p-4 rounded-md bg-gray-50">
                                        <p className="font-mono text-sm text-gray-600">
                                            Answered on: {new Date(item.submittedAt).toLocaleString()}
                                        </p>
                                        <div className="mt-2 p-2 bg-white rounded">
                                            {/* Display answer, formatting if it's an object */}
                                            {typeof item.answer === 'object' && item.answer !== null
                                                ? <pre>{JSON.stringify(item.answer, null, 2)}</pre>
                                                : String(item.answer)
                                            }
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No submissions found for this question yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Toaster />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>View Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerification} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Enter the password to view the answers for this question.
                        </p>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'View Answers'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SubmissionViewerPage;