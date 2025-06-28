// src/app/thank-you/page.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your submission has been successfully received.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            We appreciate your time and input.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouPage;