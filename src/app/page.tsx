"use client";
/* eslint-disable */
// @ts-nocheck

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import React, { useState, useEffect } from "react";

import "./globals.css";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ImageSelector } from "@/app/components/ImageSelector";
import qualificationQuestions from "@/app/components/qualificationQuestions";
import { toast, Toaster } from "sonner";

interface FormData {
  qualifications: Record<string, string>;
  imageSelections: {
    wording: string | null;
    natureOfGoods: string | null;
    serviceRepresentation: string | null;
    weightVisualization: string | null;
  };
  submittedAt: Date;
}

interface Step {
  title: string;
  component: React.ReactNode;
}

const CambodiaPostSurvey: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    qualifications: {},
    imageSelections: {
      wording: null,
      natureOfGoods: null,
      serviceRepresentation: null,
      weightVisualization: null,
    },
    submittedAt: new Date(),
  });

  useEffect(() => {
    const submitted = localStorage.getItem('surveySubmitted');
    if (submitted === 'true') {
      setHasSubmitted(true);
    }
  }, []);

  // @ts-ignore
  const steps: Step[] = [
    {
      title: "Qualification Questions",
      component: (
        <div className="grid md:grid-cols-3 gap-6">
          {qualificationQuestions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (Number(question.id) || 0) }}
              className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition-all"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {question.label}
              </h3>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      className="form-radio text-blue-600 focus:ring-blue-500"
                      onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          qualifications: {
                            ...prev.qualifications,
                            [question.id]: option,
                          },
                        }));
                      }}
                    />
                    <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: "Image Selection",
      component: (
        <div className="space-y-8">
          <ImageSelector
            name="Wording"
            options={["hs1", "hs2", "hs3"]}
            singleSelect
            onSelectionComplete={(selection) => {
              setFormData((prev) => ({
                ...prev,
                imageSelections: {
                  ...prev.imageSelections,
                  wording: selection.image,
                },
              }));
            }}
          />
          <ImageSelector
            name="Wording"
            options={["natureOfGood1", "natureOfGood1-1", "natureOfGood3", "natureOfGood4"]}
            singleSelect
            onSelectionComplete={(selection) => {
              setFormData((prev) => ({
                ...prev,
                imageSelections: {
                  ...prev.imageSelections,
                  natureOfGoods: selection.image,
                },
              }));
            }}
          />
          <ImageSelector
            name="Wording"
            options={["service1", "service2", "service3"]}
            singleSelect
            onSelectionComplete={(selection) => {
              setFormData((prev) => ({
                ...prev,
                imageSelections: {
                  ...prev.imageSelections,
                  serviceRepresentation: selection.image,
                },
              }));
            }}
          />
          <ImageSelector
            name="Wording"
            options={["weight1-IMAGE", "weight2-IMAGE", "weight3", "weight4"]}
            singleSelect
            onSelectionComplete={(selection) => {
              setFormData((prev) => ({
                ...prev,
                imageSelections: {
                  ...prev.imageSelections,
                  weightVisualization: selection.image,
                },
              }));
            }}
          />
        </div>
      ),
    },
  ];

  const handleNextStep = () => {
    const currentStepQuestions = steps[currentStep].title === "Qualification Questions"
      ? qualificationQuestions
      : [];

    if (currentStepQuestions.length > 0) {
      const allQuestionsAnswered = currentStepQuestions.every(
        (question) => formData.qualifications[question.id]
      );

      if (!allQuestionsAnswered) {
        toast.error("Please answer all questions before proceeding");
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if already submitted
    if (hasSubmitted) {
      toast.error("You have already submitted the survey.");
      return;
    }

    const allQuestionsAnswered = qualificationQuestions.every(
      (question) => formData.qualifications[question.id]
    );

    const allImageSelectionsCompleted = [
      "wording",
      "natureOfGoods",
      "serviceRepresentation",
      "weightVisualization",
    ].every((key) => formData.imageSelections[key]);

    if (!allQuestionsAnswered || !allImageSelectionsCompleted) {
      toast.error("Please complete all questions and image selections");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("https://thundering-sharai-aupp-156f29b2.koyeb.app/submit-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qualifications: formData.qualifications,
          imageSelections: formData.imageSelections,
          submittedAt: formData.submittedAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Survey submitted successfully!");
        console.log("Survey submitted:", result.message);

        // Mark as submitted locally
        localStorage.setItem('surveySubmitted', 'true');
        setHasSubmitted(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Failed to submit survey: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted, show a thank you message
  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 text-green-500" size={64} />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            You have already submitted the survey. We appreciate your participation.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Toaster />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Content Writing Survey</h1>
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="w-1/3 bg-blue-400"
          />
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            {steps[currentStep].title}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {steps[currentStep].component}

            <div className="flex justify-between mt-8">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex items-center space-x-2"
                >
                  <ArrowRight className="w-5 h-5 transform rotate-180" />
                  <span>Previous</span>
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="ml-auto flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <CheckCircle2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Submit</span>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CambodiaPostSurvey;