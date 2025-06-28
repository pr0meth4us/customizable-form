"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const ThankYouPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md text-center animate-fade-in">
                <CardHeader>
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-3xl font-bold">Thank You!</CardTitle>
                    <CardDescription className="text-lg">
                        Your submission has been successfully received.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        We appreciate you taking the time to complete the questionnaire.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ThankYouPage;