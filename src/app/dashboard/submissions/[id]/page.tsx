"use client";

import {useState, useEffect, FormEvent, ChangeEvent} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface SubmissionAnswers {
    [questionId: string]: string | { image?: string; reasons?: string[]; customReason?: string; } | unknown;
}

interface Submission {
    _id: string;
    answers: SubmissionAnswers;
    submittedAt: string;
}

interface QuestionMeta {
    id: string;
    label: string;
}

interface Questionnaire {
    _id: string;
    title: string;
    questions: QuestionMeta[];
}


const SubmissionViewerPage = () => {
    const params = useParams();
    const router = useRouter();
    const { id: questionnaireId } = params as { id: string };
    const [password, setPassword] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        const fetchQuestionnaireInfo = async () => {
            if (!questionnaireId) return;
            try {
                const res = await fetch(`/api/questionnaires/${questionnaireId}`);
                if (res.ok) {
                    const data: Questionnaire = await res.json();
                    setQuestionnaire(data);
                } else {
                    toast.error("Could not find questionnaire.");
                    router.push('/dashboard');
                }
            } catch (error: unknown) {
                console.error("Error fetching questionnaire details:", error);
                toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        void fetchQuestionnaireInfo(); // Add void operator
    }, [questionnaireId, router]);

    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error("Please enter the password.");
            return;
        }

        try {
            // 1. Verify password
            const verifyRes = await fetch(`/api/questionnaires/${questionnaireId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (!verifyRes.ok) {
                toast.error("Incorrect password.");
                return;
            }

            // 2. Fetch submissions
            const subRes = await fetch(`/api/questionnaires/${questionnaireId}/submissions`, {
                headers: { 'Authorization': `Bearer ${password}` }
            });
            if(subRes.ok) {
                const data: Submission[] = await subRes.json();
                setSubmissions(data);
                setIsAuthenticated(true);
                toast.success("Access granted.");
            } else {
                toast.error("Could not fetch submissions even with correct password.");
            }

        } catch (error: unknown) {
            console.error("An error occurred during verification:", error);
            toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
        }
    };

    const getQuestionLabel = (qId: string): string => {
        return questionnaire?.questions.find((q: QuestionMeta) => q.id === qId)?.label || qId;
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Toaster richColors />
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>View Submissions</CardTitle>
                        <CardDescription>Enter the password for &rsquo;{questionnaire?.title || 'this questionnaire'}&rsquo; to see its submissions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </div>
                            <Button type="submit" className="w-full">Unlock</Button>
                        </form>
                        <Button variant="link" className="mt-4" onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Toaster richColors/>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Submissions for: {questionnaire?.title || 'Loading...'}</h1>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>

            {submissions.length === 0 ? (
                <p>No submissions yet for this questionnaire.</p>
            ) : (
                <div className="space-y-6">
                    {submissions.map((sub: Submission, index: number) => (
                        <Card key={sub._id}>
                            <CardHeader>
                                <CardTitle>Submission #{index + 1}</CardTitle>
                                <CardDescription>
                                    Submitted on: {new Date(sub.submittedAt).toLocaleString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(sub.answers).map(([qId, answer]: [string, unknown]) => (
                                        <div key={qId} className="border-t pt-4">
                                            <p className="font-semibold text-gray-800">{getQuestionLabel(qId)}</p>
                                            <div className="text-gray-600 mt-1 pl-4">
                                                {typeof answer === 'object' && answer !== null ?
                                                    (<pre className="bg-gray-100 p-2 rounded-md text-sm whitespace-pre-wrap">{JSON.stringify(answer, null, 2)}</pre>) : (
                                                        <p>{String(answer)}</p>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubmissionViewerPage;