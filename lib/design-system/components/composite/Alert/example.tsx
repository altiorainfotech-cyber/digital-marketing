'use client';

/**
 * Alert Component Examples
 * 
 * This file demonstrates various use cases for the Alert component.
 * Copy these examples into your components as needed.
 */

import React, { useState } from 'react';
import { Alert } from './Alert';

/**
 * Example 1: Basic Error Alert
 */
export function BasicErrorAlert() {
  return (
    <Alert
      type="error"
      message="Something went wrong. Please try again."
    />
  );
}

/**
 * Example 2: Success Alert with Title
 */
export function SuccessAlertWithTitle() {
  return (
    <Alert
      type="success"
      title="Success!"
      message="Your changes have been saved successfully."
    />
  );
}

/**
 * Example 3: Dismissible Warning Alert
 */
export function DismissibleWarningAlert() {
  const [showAlert, setShowAlert] = useState(true);

  if (!showAlert) {
    return <p className="text-sm text-neutral-600">Alert dismissed</p>;
  }

  return (
    <Alert
      type="warning"
      title="Warning"
      message="This action cannot be undone. Please proceed with caution."
      dismissible
      onDismiss={() => setShowAlert(false)}
    />
  );
}

/**
 * Example 4: Info Alert with Additional Content
 */
export function InfoAlertWithContent() {
  return (
    <Alert
      type="info"
      title="New Features Available"
      message="We've added some exciting new features:"
    >
      <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
        <li>Dark mode support</li>
        <li>Improved search functionality</li>
        <li>Better mobile experience</li>
      </ul>
    </Alert>
  );
}

/**
 * Example 5: Multiple Errors Alert
 */
export function MultipleErrorsAlert() {
  const errors = [
    'Email is required',
    'Password must be at least 8 characters',
    'Name cannot be empty',
  ];

  return (
    <Alert
      type="error"
      title={`${errors.length} Errors Found`}
      message=""
    >
      <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </Alert>
  );
}

/**
 * Example 6: Alert in Form Context
 */
export function FormWithAlert() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate validation
    const isValid = Math.random() > 0.5;
    
    if (isValid) {
      setSuccess(true);
      setError(null);
    } else {
      setError('Form submission failed. Please check your input.');
      setSuccess(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}
      
      {success && (
        <Alert
          type="success"
          title="Success!"
          message="Form submitted successfully."
          dismissible
          onDismiss={() => setSuccess(false)}
        />
      )}

      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Submit
      </button>
    </form>
  );
}

/**
 * Example 7: All Alert Types
 */
export function AllAlertTypes() {
  return (
    <div className="space-y-4">
      <Alert
        type="success"
        title="Success"
        message="Operation completed successfully."
      />
      
      <Alert
        type="error"
        title="Error"
        message="An error occurred while processing your request."
      />
      
      <Alert
        type="warning"
        title="Warning"
        message="Please review your changes before proceeding."
      />
      
      <Alert
        type="info"
        title="Information"
        message="This is an informational message."
      />
    </div>
  );
}
