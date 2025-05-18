
import React from 'react';

interface EmptyAlertProps {
  title: string;
  message: string;
}

export const EmptyAlert = ({ title, message }: EmptyAlertProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="rounded-full bg-green-100 p-3 text-green-600">
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
};
