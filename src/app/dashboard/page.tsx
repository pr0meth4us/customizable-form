/*
 * =================================================================
 * FILE: src/app/dashboard/page.tsx
 * =================================================================
 * WHAT'S NEW:
 * - Removed the list of existing questionnaires to enhance security.
 * - Added a dedicated button to navigate to the new submission viewer page.
 * - The primary purpose of this page is now solely for questionnaire creation.
 * - Renamed from 'admin' to 'dashboard' for better context.
 * =================================================================
 */
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Eye, Copy, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Interfaces
interface Question {
  id: string;
  label: string;
  type: 'radio' | 'text' | 'image-select';
  options?: string[];
  instructions?: string;
  imageOptions?: string[];
  imageLabels?: string[];
}

interface Questionnaire {
  _id?: string;
  title: string;
  description: string;
  layout: 'multi-page' | 'single-page';
  questions: Question[];
  password?: string;
}

interface CreatedInfo {
  id: string;
  title: string;
  password?: string;
}

// Main Dashboard Component
const DashboardPage = () => { // Renamed component from AdminPage
  const router = useRouter();
  const [newQuestionnaire, setNewQuestionnaire] = useState<Questionnaire>({
    title: '',
    description: '',
    layout: 'multi-page',
    questions: []
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedInfo | null>(null);

  // --- Core Logic ---
  const handleCreateQuestionnaire = async () => {
    if (!newQuestionnaire.title) {
      toast.error("Please provide a title for the questionnaire.");
      return;
    }
    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestionnaire),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Questionnaire created successfully!");
        setCreatedInfo({ id: data._id, title: data.title, password: data.password });
        setNewQuestionnaire({ title: '', description: '', layout: 'multi-page', questions: [] });
      } else {
        const errorData = await res.json();
        toast.error(`Failed to create questionnaire: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("An error occurred while creating the questionnaire.");
    }
  };

  const addQuestion = () => {
    setNewQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, { id: `q${Date.now()}`, label: '', type: 'radio', options: [''] }]
    }));
  };

  const removeQuestion = (qIndex: number) => {
    setNewQuestionnaire(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
    if (field === 'type') {
      updatedQuestions[qIndex].options = value === 'radio' ?
          [''] : undefined;
      updatedQuestions[qIndex].imageOptions = value === 'image-select' ? [''] : undefined;
      updatedQuestions[qIndex].imageLabels = value === 'image-select' ?
          [''] : undefined;
    }
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    if(updatedQuestions[qIndex].options) {
      updatedQuestions[qIndex].options![oIndex] = value;
      setNewQuestionnaire(prev => ({...prev, questions: updatedQuestions}));
    }
  };
  const addOption = (qIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    if(!updatedQuestions[qIndex].options) updatedQuestions[qIndex].options = [];
    updatedQuestions[qIndex].options!.push('');
    setNewQuestionnaire(prev => ({...prev, questions: updatedQuestions}));
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[qIndex].options?.splice(oIndex, 1);
    setNewQuestionnaire(prev => ({...prev, questions: updatedQuestions}));
  };

  // Added missing helper functions for image selection fields
  const handleArrayFieldChange = (qIndex: number, field: 'options' | 'imageOptions' | 'imageLabels', oIndex: number, value: string) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const targetArray = updatedQuestions[qIndex][field] as string[] | undefined;
    if (targetArray) {
      targetArray[oIndex] = value;
      setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
    }
  }

  const addArrayField = (qIndex: number, field: 'options' | 'imageOptions' | 'imageLabels') => {
    const updatedQuestions = [...newQuestionnaire.questions];
    if (!updatedQuestions[qIndex][field]) {
      updatedQuestions[qIndex][field] = [];
    }
    (updatedQuestions[qIndex][field] as string[]).push('');
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  }

  const removeArrayField = (qIndex: number, field: 'options' | 'imageOptions' | 'imageLabels', oIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    if (updatedQuestions[qIndex][field]) {
      (updatedQuestions[qIndex][field] as string[]).splice(oIndex, 1);
      setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
    }
  }

  const setPredefinedOptions = (qIndex: number, type: 'yes-no' | 'likert-5') => {
    const updatedQuestions = [...newQuestionnaire.questions];
    let options: string[] = [];
    if(type === 'yes-no') options = ['Yes', 'No'];
    if(type === 'likert-5') options = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
    updatedQuestions[qIndex].options = options;
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  return (
      <div className="container mx-auto p-4 md:p-8">
        <Toaster richColors />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Survey Management Dashboard</h1> {/* Updated title */}
          {/* Button to navigate to the new submission viewer */}
          <Button variant="outline" onClick={() => router.push('/dashboard/view')}> {/* Updated route */}
            <Eye className="mr-2 h-4 w-4" /> View Submissions
          </Button>
        </div>

        <Dialog open={!!createdInfo} onOpenChange={() => setCreatedInfo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Questionnaire Created!</DialogTitle>
              <DialogDescription>
                Your new questionnaire has been saved.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                <div className="flex">
                  <div className="py-1"><AlertTriangle className="h-6 w-6 text-yellow-500 mr-4"/></div>
                  <div>
                    <p className="font-bold">Save These Details!</p>
                    <p className="text-sm">You need the ID and Password to view submissions. They cannot be recovered.</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="new-id">Questionnaire ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input id="new-id" readOnly value={createdInfo?.id} className="font-mono"/>
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.clipboard.writeText(createdInfo?.id || '');
                      toast.success("ID copied to clipboard!");
                    }}> <Copy className="h-4 w-4" /> </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-password">Admin Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input id="new-password" readOnly value={createdInfo?.password} className="font-mono"/>
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.clipboard.writeText(createdInfo?.password || '');
                      toast.success("Password copied to clipboard!");
                    }}> <Copy className="h-4 w-4" /> </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader><CardTitle>Create New Questionnaire</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <Input placeholder="Questionnaire Title" value={newQuestionnaire.title} onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, title: e.target.value }))} />
            <Textarea placeholder="Questionnaire Description" value={newQuestionnaire.description} onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, description: e.target.value }))} />
            <div>
              <Label>Survey Layout</Label>
              <RadioGroup value={newQuestionnaire.layout} onValueChange={(value: 'multi-page' | 'single-page') => setNewQuestionnaire(prev => ({ ...prev, layout: value }))} className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="multi-page" id="r1" /><Label htmlFor="r1">One Question Per Page</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="single-page" id="r2" /><Label htmlFor="r2">All Questions on One Page</Label></div>
              </RadioGroup>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Questions</h3>
              {newQuestionnaire.questions.map((q, qIndex) => (
                  <Card key={qIndex} className="mb-4 p-4 space-y-4 relative">
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    <Input placeholder="Question Label" value={q.label} onChange={(e) => handleQuestionChange(qIndex, 'label', e.target.value)} className="font-semibold" />
                    <Select value={q.type} onValueChange={(value) => handleQuestionChange(qIndex, 'type', value)}>
                      <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radio">Radio Buttons</SelectItem>
                        <SelectItem value="text">Text Input</SelectItem>
                        <SelectItem value="image-select">Image Selection</SelectItem>
                      </SelectContent>
                    </Select>
                    {q.type === 'radio' && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Options</h4>
                          <div className="flex gap-2 mb-3">
                            <Button size="sm" variant="outline" onClick={() => setPredefinedOptions(qIndex, 'yes-no')}>Add Yes/No</Button>
                            <Button size="sm" variant="outline" onClick={() => setPredefinedOptions(qIndex, 'likert-5')}>Add Likert (1-5)</Button>
                          </div>
                          {q.options?.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2 mb-2">
                                <Input placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => removeOption(qIndex, oIndex)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => addOption(qIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button>
                        </div>
                    )}
                    {q.type === 'text' && (
                        <div>
                          <p className="text-sm text-muted-foreground">Text input fields do not require options.</p>
                        </div>
                    )}
                    {q.type === 'image-select' && (
                        <div className="space-y-4">
                          <Textarea placeholder="Instructions for image selection" value={q.instructions || ''} onChange={(e) => handleQuestionChange(qIndex, 'instructions', e.target.value)} />
                          <div>
                            <h4 className="text-sm font-medium mb-2">Image URLs</h4>
                            {q.imageOptions?.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2 mb-2">
                                  <Input placeholder={`https://.../image${oIndex + 1}.png`} value={opt} onChange={(e) => handleArrayFieldChange(qIndex, 'imageOptions', oIndex, e.target.value)} />
                                  <Button variant="ghost" size="icon" onClick={() => removeArrayField(qIndex, 'imageOptions', oIndex)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addArrayField(qIndex, 'imageOptions')}><PlusCircle className="mr-2 h-4 w-4" /> Add Image URL</Button>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Image Labels</h4>
                            {q.imageLabels?.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2 mb-2">
                                  <Input placeholder={`Label ${oIndex + 1}`} value={opt} onChange={(e) => handleArrayFieldChange(qIndex, 'imageLabels', oIndex, e.target.value)} />
                                  <Button variant="ghost" size="icon" onClick={() => removeArrayField(qIndex, 'imageLabels', oIndex)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => addArrayField(qIndex, 'imageLabels')}><PlusCircle className="mr-2 h-4 w-4" /> Add Label</Button>
                          </div>
                        </div>
                    )}
                  </Card>
              ))}
              <Button onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
            </div>
          </CardContent>
          <CardFooter><Button onClick={handleCreateQuestionnaire}>Create Questionnaire</Button></CardFooter>
        </Card>
      </div>
  );
};

export default DashboardPage; // Renamed export