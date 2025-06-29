"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlusCircle, Trash2, Eye, Copy, AlertTriangle, Link as LinkIcon, Loader2 } from 'lucide-react';
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
  imageUrl?: string;
  reasons?: string[];
}

interface Questionnaire {
  _id?: string;
  title: string;
  description: string;
  layout: 'multi-page.tsx' | 'single-page.tsx';
  questions: Question[];
  password?: string;
}

interface CreatedInfo {
  id: string;
  title: string;
  password?: string;
}

const DashboardPage = () => {
  const router = useRouter();
  const [newQuestionnaire, setNewQuestionnaire] = useState<Questionnaire>({
    title: '',
    description: '',
    layout: 'multi-page.tsx',
    questions: []
  });
  const [createdInfo, setCreatedInfo] = useState<CreatedInfo | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // MODIFIED: Added duplicate checking to validation
  const validateQuestionnaire = (): boolean => {
    if (!newQuestionnaire.title.trim()) {
      toast.error("Please provide a title for the questionnaire.");
      return false;
    }

    for (let i = 0; i < newQuestionnaire.questions.length; i++) {
      const q = newQuestionnaire.questions[i];
      if (!q.label.trim()) {
        toast.error(`Question #${i + 1} is missing a label.`);
        return false;
      }

      if (q.type === 'radio') {
        const validOptions = q.options?.filter(opt => opt.trim() !== '') || [];
        if (validOptions.length < 2) {
          toast.error(`Question #${i + 1} ("${q.label}") must have at least two non-empty options.`);
          return false;
        }
        if (new Set(validOptions).size !== validOptions.length) {
          toast.error(`Question #${i + 1} ("${q.label}") has duplicate options.`);
          return false;
        }
      }

      if (q.type === 'image-select') {
        const validImageOptions = q.imageOptions?.filter(opt => opt.trim() !== '') || [];
        if (validImageOptions.length < 2) {
          toast.error(`Question #${i + 1} ("${q.label}") must have at least two non-empty image URLs.`);
          return false;
        }
        if (new Set(validImageOptions).size !== validImageOptions.length) {
          toast.error(`Question #${i + 1} ("${q.label}") has duplicate image URLs.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleCreateQuestionnaire = async () => {
    if (!validateQuestionnaire()) {
      return;
    }

    setIsCreating(true);

    const payload = {
      ...newQuestionnaire,
      questions: newQuestionnaire.questions.map(q => {
        const { reasons, ...rest } = q;
        // Ensure empty strings are filtered out but an intentionally empty array is respected
        if (q.type === 'image-select' && reasons) {
          const filteredReasons = reasons.filter(r => r.trim() !== '');
          if (filteredReasons.length > 0) {
            return { ...q, reasons: filteredReasons };
          } else if (reasons.length > 0 && filteredReasons.length === 0) {
            // User entered spaces, treat as empty
            return rest;
          }
          // If reasons is an empty array [], respect it
          return { ...q };
        }
        return rest;
      })
    };

    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Questionnaire created successfully!");
        setCreatedInfo({ id: data._id, title: data.title, password: data.password });
        setNewQuestionnaire({ title: '', description: '', layout: 'multi-page.tsx', questions: [] });
      } else {
        const errorData = await res.json();
        toast.error(`Failed to create questionnaire: ${errorData.message}`);
      }
    } catch (error) {
      toast.error("An error occurred while creating the questionnaire.", error instanceof Error ? {description: error.message} : undefined);
    } finally {
      setIsCreating(false);
    }
  };

  const addQuestion = () => {
    setNewQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, { id: crypto.randomUUID(), label: '', type: 'radio', options: ['', ''] }]
    }));
  };

  const removeQuestion = (qIndex: number) => {
    setNewQuestionnaire(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIndex) }));
  };

  const handleQuestionChange = (qIndex: number, field: keyof Question, value: unknown) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], [field]: value };
    if (field === 'type') {
      const questionType = value as Question['type'];
      updatedQuestions[qIndex].options = questionType === 'radio' ? ['', ''] : undefined;
      updatedQuestions[qIndex].imageOptions = questionType === 'image-select' ? ['', ''] : undefined;
      updatedQuestions[qIndex].imageLabels = questionType === 'image-select' ? ['', ''] : undefined;
      updatedQuestions[qIndex].reasons = questionType === 'image-select' ? [] : undefined;
    }
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleArrayFieldChange = (qIndex: number, field: 'options' | 'imageOptions' | 'imageLabels' | 'reasons', oIndex: number, value: string) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const targetArray = updatedQuestions[qIndex][field] as string[] | undefined;
    if (targetArray) {
      targetArray[oIndex] = value;
      setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
    }
  }

  const addArrayField = (qIndex: number, field: 'options' | 'reasons') => {
    const updatedQuestions = [...newQuestionnaire.questions];
    if (!updatedQuestions[qIndex][field]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      (updatedQuestions[qIndex] as unknown)[field] = [];
    }
    (updatedQuestions[qIndex][field] as string[]).push('');
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  }

  const removeArrayField = (qIndex: number, field: 'options' | 'reasons', oIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const currentOptions = updatedQuestions[qIndex][field] as string[] | undefined;
    // For radio options, enforce minimum of 2
    if (field === 'options' && currentOptions && currentOptions.length <= 2) {
      toast.info("A minimum of 2 options is required.");
      return;
    }
    currentOptions?.splice(oIndex, 1);
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  }

  const addImageOptionAndLabel = (qIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const question = updatedQuestions[qIndex];
    if (!question.imageOptions) question.imageOptions = [];
    if (!question.imageLabels) question.imageLabels = [];
    question.imageOptions.push('');
    question.imageLabels.push('');
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeImageOptionAndLabel = (qIndex: number, oIndex: number) => {
    const updatedQuestions = [...newQuestionnaire.questions];
    const question = updatedQuestions[qIndex];
    if (question.imageOptions && question.imageOptions.length <= 2) {
      toast.info("A minimum of 2 image options is required.");
      return;
    }
    if (question.imageOptions) question.imageOptions.splice(oIndex, 1);
    if (question.imageLabels) question.imageLabels.splice(oIndex, 1);
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const setPredefinedOptions = (qIndex: number, type: 'yes-no' | 'likert-5') => {
    const updatedQuestions = [...newQuestionnaire.questions];
    updatedQuestions[qIndex].options = type === 'yes-no' ? ['Yes', 'No'] : ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
    setNewQuestionnaire(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const surveyLink = createdInfo ? `${baseUrl}/questionnaire/${createdInfo.id}` : '';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Toaster richColors position="top-center" />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Survey Management Dashboard</h1>
        <Button variant="outline" onClick={() => router.push('/dashboard/view')}>
          <Eye className="mr-2 h-4 w-4" /> View Submissions
        </Button>
      </div>

      <Dialog open={!!createdInfo} onOpenChange={() => setCreatedInfo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Questionnaire Created!</DialogTitle>
            <DialogDescription>Your new questionnaire has been saved. Save the details below.</DialogDescription>
          </DialogHeader>
          <div className="my-4 space-y-4">
            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-6 w-6 text-green-600"/>
                <div>
                  <Label htmlFor="new-link" className="font-bold text-green-900">Shareable Survey Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input id="new-link" readOnly value={surveyLink} className="font-mono bg-white"/>
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(surveyLink); toast.success("Link copied to clipboard!"); }}> <Copy className="h-4 w-4" /> </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1"/>
                <div>
                  <p className="font-bold text-yellow-900">Admin-Only Details (Cannot be recovered)</p>
                  <div className="mt-2 space-y-3">
                    <div>
                      <Label htmlFor="new-id">Questionnaire ID</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input id="new-id" readOnly value={createdInfo?.id} className="font-mono bg-white"/>
                        <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(createdInfo?.id || ''); toast.success("ID copied to clipboard!"); }}> <Copy className="h-4 w-4" /> </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new-password">Admin Password</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input id="new-password" readOnly value={createdInfo?.password} className="font-mono bg-white"/>
                        <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(createdInfo?.password || ''); toast.success("Password copied to clipboard!"); }}> <Copy className="h-4 w-4" /> </Button>
                      </div>
                    </div>
                  </div>
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
              <Card key={q.id} className="mb-4 p-4 space-y-4 relative">
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
                <Input placeholder="Optional: URL for an instruction image" value={q.imageUrl || ''} onChange={(e) => handleQuestionChange(qIndex, 'imageUrl', e.target.value)} />
                <Textarea placeholder="Optional: Instructions for the user" value={q.instructions || ''} onChange={(e) => handleQuestionChange(qIndex, 'instructions', e.target.value)} />

                {q.type === 'radio' && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Options</h4>
                    <p className="text-xs text-muted-foreground mb-2">At least 2 unique options are required.</p>
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" variant="outline" onClick={() => setPredefinedOptions(qIndex, 'yes-no')}>Add Yes/No</Button>
                      <Button size="sm" variant="outline" onClick={() => setPredefinedOptions(qIndex, 'likert-5')}>Add Likert (1-5)</Button>
                    </div>
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2 mb-2">
                        <Input placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => handleArrayFieldChange(qIndex, 'options', oIndex, e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeArrayField(qIndex, 'options', oIndex)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addArrayField(qIndex, 'options')}><PlusCircle className="mr-2 h-4 w-4" /> Add Option</Button>
                  </div>
                )}
                {q.type === 'text' && (
                  <div><p className="text-sm text-muted-foreground">Text input fields do not require options.</p></div>
                )}
                {q.type === 'image-select' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Image Options (URL and Label)</h4>
                      <p className="text-xs text-muted-foreground mb-2">At least 2 unique image options are required.</p>
                      {q.imageOptions?.map((_, oIndex) => (
                        <div key={oIndex} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 p-2 border rounded-md relative">
                          <Input placeholder={`https://.../image${oIndex + 1}.png`} value={q.imageOptions?.[oIndex] || ''} onChange={(e) => handleArrayFieldChange(qIndex, 'imageOptions', oIndex, e.target.value)} />
                          <Input placeholder={`Label for Image ${oIndex + 1}`} value={q.imageLabels?.[oIndex] || ''} onChange={(e) => handleArrayFieldChange(qIndex, 'imageLabels', oIndex, e.target.value)} />
                          <Button variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1" onClick={() => removeImageOptionAndLabel(qIndex, oIndex)}><Trash2 className="h-4 w-4 text-gray-500" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addImageOptionAndLabel(qIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Add Image Option</Button>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Selection Reasons (Optional)</h4>
                      <p className="text-xs text-muted-foreground mb-2">Define custom reasons for users to choose from.</p>
                      {q.reasons?.map((reason, rIndex) => (
                        <div key={rIndex} className="flex items-center gap-2 mb-2">
                          <Input placeholder={`Reason ${rIndex + 1}`} value={reason} onChange={(e) => handleArrayFieldChange(qIndex, 'reasons', rIndex, e.target.value)} />
                          <Button variant="ghost" size="icon" onClick={() => removeArrayField(qIndex, 'reasons', rIndex)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addArrayField(qIndex, 'reasons')}><PlusCircle className="mr-2 h-4 w-4" /> Add Reason</Button>

                    </div>
                  </div>
                )}
              </Card>
            ))}
            <Button onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCreateQuestionnaire} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : "Create Questionnaire"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DashboardPage;