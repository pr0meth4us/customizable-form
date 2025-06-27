"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Question {
  id: string;
  label: string;
  type: 'radio' | 'text' | 'image-select';
  options?: string[];
  instructions?: string;
  imageOptions?: string[]; // Will store URLs
  imageLabels?: string[];
}

interface Questionnaire {
  _id?: string;
  title: string;
  description: string;
  layout: 'multi-page' | 'single-page';
  questions: Question[];
}

const AdminPage = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [newQuestionnaire, setNewQuestionnaire] = useState<Questionnaire>({
    title: '',
    description: '',
    layout: 'multi-page',
    questions: []
  });

  // Placeholder for fetch function
  const fetchQuestionnaires = async () => {
    try {
      const res = await fetch('/api/questionnaires');
      if (res.ok) {
        const data = await res.json();
        setQuestionnaires(data);
      } else {
        toast.error("Failed to fetch existing questionnaires.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching questionnaires.");
    }
  };

  useEffect(() => { fetchQuestionnaires(); }, []);


  // Placeholder for create function
  const handleCreateQuestionnaire = async () => {
    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestionnaire),
      });
      if (res.ok) {
        toast.success("Questionnaire created successfully!");
        setNewQuestionnaire({ title: '', description: '', layout: 'multi-page', questions: [] });
        fetchQuestionnaires();
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
      questions: [
        ...prev.questions,
        { id: `q${Date.now()}`, label: '', type: 'radio', options: [''] }
      ]
    }));
  };

  const removeQuestion = (qIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions.splice(qIndex, 1);
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
    if (field === 'type') {
      updatedQuestions[qIndex].options = value === 'radio' ? [''] : [];
      updatedQuestions[qIndex].imageOptions = value === 'image-select' ? [''] : [];
      updatedQuestions[qIndex].imageLabels = value === 'image-select' ? [''] : [];
    }
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleArrayFieldChange = (qIndex: number, field: 'options' | 'imageOptions' | 'imageLabels', oIndex: number, value: string) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const targetArray = updatedQuestions[qIndex][field] as string[];
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Questionnaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input placeholder="Questionnaire Title" value={newQuestionnaire.title} onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, title: e.target.value }))} />
          <Textarea placeholder="Questionnaire Description" value={newQuestionnaire.description} onChange={(e) => setNewQuestionnaire(prev => ({ ...prev, description: e.target.value }))} />
          <div>
            <Label>Survey Layout</Label>
            <RadioGroup value={newQuestionnaire.layout} onValueChange={(value: 'multi-page' | 'single-page') => setNewQuestionnaire(prev => ({...prev, layout: value}))} className="flex gap-4 mt-2">
              <div className="flex items-center space-x-2"><RadioGroupItem value="multi-page" id="r1" /><Label htmlFor="r1">One Question Per Page</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="single-page" id="r2" /><Label htmlFor="r2">All Questions on One Page</Label></div>
            </RadioGroup>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Questions</h3>
            {newQuestionnaire.questions.map((q, qIndex) => (
              <Card key={qIndex} className="mb-4 p-4 space-y-4 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                <Input placeholder="Question Label" value={q.label} onChange={(e) => handleQuestionChange(qIndex, 'label', e.target.value)} className="font-semibold"/>
                <div>
                  <Label>Question Type</Label>
                  <Select value={q.type} onValueChange={(value) => handleQuestionChange(qIndex, 'type', value)}>
                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">Radio Buttons</SelectItem>
                      <SelectItem value="text">Text Input</SelectItem>
                      <SelectItem value="image-select">Image Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {q.type === 'radio' && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Options</h4>
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2 mb-2">
                        <Input placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleArrayFieldChange(qIndex, 'options', oIndex, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField(qIndex, 'options', oIndex)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addArrayField(qIndex, 'options')}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button>
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

export default AdminPage;
