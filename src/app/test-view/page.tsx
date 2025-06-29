"use client";

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from 'sonner';
import { ArrowLeft, Table, LayoutList, Download } from 'lucide-react';

interface Submission {
  _id: string;
  answers: Record<string, unknown>;
  submittedAt: string;
}

interface Question {
  id: string;
  label: string;
  type: 'radio' | 'text' | 'image-select';
  options?: string[];
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
}

interface QuestionnaireInfo {
  _id: string;
  title: string;
  questions: Question[];
}

type ViewMode = 'cards' | 'spreadsheet';

declare global {
  interface Navigator {
    msSaveOrOpenBlob?: (blob: Blob, filename: string) => boolean;
  }
}

const TestSubmissionViewerPage = () => {
  const router = useRouter();
  // MODIFIED: Updated the hardcoded password
  const [questionnaireId, setQuestionnaireId] = useState('6860ef4aef31e80de610b325');
  const [password, setPassword] = useState('zBE5neqI3iNoAJf4HF#@*$yA');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('spreadsheet');
  const [questionnaireInfo, setQuestionnaireInfo] = useState<QuestionnaireInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (isAuthenticated && questionnaireInfo?.title) {
      document.title = `Submissions: ${questionnaireInfo.title}`;
    } else {
      document.title = "Test Submission Viewer";
    }
  }, [isAuthenticated, questionnaireInfo?.title]);

  const handleFormSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!questionnaireId || !password) {
      toast.error("Please enter both the ID and Password.");
      return;
    }
    setIsLoading(true);
    try {
      const verifyRes = await fetch(`/api/questionnaires/${questionnaireId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!verifyRes.ok) {
        toast.error("Incorrect ID or Password.");
        setIsLoading(false);
        return;
      }

      const infoRes = await fetch(`/api/questionnaires/${questionnaireId}`);
      if(!infoRes.ok) throw new Error("Could not fetch questionnaire details.");
      const infoData: QuestionnaireInfo = await infoRes.json();
      setQuestionnaireInfo(infoData);

      const subRes = await fetch(`/api/questionnaires/${questionnaireId}/submissions`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if(!subRes.ok) throw new Error("Could not fetch submissions.");
      const subData = await subRes.json();

      setSubmissions(subData);
      setIsAuthenticated(true);
      toast.success("Access granted. Showing submissions.");
    } catch (error) {
      toast.error("An error occurred. Please check the details and try again.", error instanceof Error ? { description: error.message } : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuestionLabel = (qId: string) => {
    return questionnaireInfo?.questions.find(q => q.id === qId)?.label || qId;
  }

  const getAllQuestionIdsInOrder = () => {
    return questionnaireInfo?.questions.map(q => q.id) || [];
  };

  const formatAnswerForExport = (answer: unknown) => {
    if (typeof answer === 'object' && answer !== null) {
      if ('image' in answer && 'reasons' in answer && Array.isArray(answer.reasons)) {
        let formatted = `Image: ${answer.image} | Reasons: ${answer.reasons.join(', ')}`;
        if ('customReason' in answer && typeof answer.customReason === 'string' && answer.customReason) {
          formatted += ` | Custom: ${answer.customReason}`;
        }
        return formatted;
      }
      return JSON.stringify(answer);
    }
    return String(answer);
  };

  const exportToCSV = () => {
    if (submissions.length === 0 || !questionnaireInfo) {
      toast.error("No data to export.");
      return;
    }

    const headers = ["Submission #", "Submitted At", ...getAllQuestionIdsInOrder().map(getQuestionLabel)];
    let csvContent = headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';

    submissions.forEach((sub, subIndex) => {
      const rowData = [
        String(subIndex + 1),
        `"${new Date(sub.submittedAt).toLocaleString().replace(/"/g, '""')}"`,
        ...getAllQuestionIdsInOrder().map(qId => {
          const answer = formatAnswerForExport(sub.answers[qId]);
          return `"${answer.replace(/"/g, '""')}"`;
        })
      ];
      csvContent += rowData.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${questionnaireInfo.title.replace(/\s/g, '_')}_submissions.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded!");
  };

  const exportToExcel = () => {
    if (!tableRef.current) {
      toast.error("Spreadsheet view must be active to export to Excel.");
      return;
    }

    const tableHTML = tableRef.current.outerHTML;
    const fileName = `${questionnaireInfo?.title.replace(/\s/g, '_')}_submissions.xls`;
    const dataType = 'application/vnd.ms-excel';

    if (navigator.msSaveOrOpenBlob) {
      const blob = new Blob(['\ufeff', tableHTML], { type: dataType });
      navigator.msSaveOrOpenBlob(blob, fileName);
    } else {
      const downloadLink = document.createElement('a');
      document.body.appendChild(downloadLink);
      downloadLink.href = 'data:' + dataType + ', ' + encodeURIComponent(tableHTML);
      downloadLink.download = fileName;
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    toast.success("Excel file downloaded!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Toaster richColors />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test Submission Viewer</CardTitle>
            <CardDescription>Test credentials have been provided below. Click the button to view submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="qId">Questionnaire ID</Label>
                <Input
                  id="qId"
                  type="text"
                  value={questionnaireId}
                  onChange={(e) => setQuestionnaireId(e.target.value)}
                  placeholder="Enter the questionnaire ID"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Get Test Submissions"}
              </Button>
            </form>
            <Button variant="link" className="mt-4" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
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
        <h1 className="text-3xl font-bold">Submissions for: {questionnaireInfo?.title || 'Loading...'}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setIsAuthenticated(false);
            setQuestionnaireId('6860ef4aef31e80de610b325');
            setPassword('zBE5neqI3iNoAJf4HF#@*$yA');
          }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> View Another
          </Button>
          <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>
            <LayoutList className="mr-2 h-4 w-4" /> Card View
          </Button>
          <Button variant={viewMode === 'spreadsheet' ? 'default' : 'outline'} onClick={() => setViewMode('spreadsheet')}>
            <Table className="mr-2 h-4 w-4" /> Spreadsheet View
          </Button>
          {submissions.length > 0 && (
            <>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
            </>
          )}
        </div>
      </div>
      {submissions.length === 0 ? (
        <p>No submissions yet for this questionnaire.</p>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="space-y-6">
              {submissions.map((sub, index) => (
                <Card key={sub._id}>
                  <CardHeader>
                    <CardTitle>Submission #{index + 1}</CardTitle>
                    <CardDescription>
                      Submitted on: {new Date(sub.submittedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(sub.answers).map(([qId, answer]) => (
                        <div key={qId} className="border-t pt-4 first:border-t-0">
                          <p className="font-semibold text-gray-800">{getQuestionLabel(qId)}</p>
                          <div className="text-gray-600 mt-1 pl-4">
                            {typeof answer === 'object' && answer !== null ? (
                              <pre className="bg-gray-100 p-2 rounded-md text-sm whitespace-pre-wrap">{JSON.stringify(answer, null, 2)}</pre>
                            ) : (
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
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table ref={tableRef} id="submissions-table" className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                  {getAllQuestionIdsInOrder().map(qId => (
                    <th key={qId} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getQuestionLabel(qId)}
                    </th>
                  ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((sub, subIndex) => (
                  <tr key={sub._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subIndex + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                    {getAllQuestionIdsInOrder().map(qId => {
                      const answer = sub.answers[qId];
                      const displayAnswer = formatAnswerForExport(answer);
                      return (
                        <td key={qId} className="px-6 py-4 text-sm text-gray-500 break-words max-w-xs">{displayAnswer}</td>
                      );
                    })}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestSubmissionViewerPage;