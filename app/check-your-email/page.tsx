import Link from 'next/link';
import React from 'react';

export default function CheckYourEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-xl w-full bg-white border rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-semibold mb-4">Check your email</h1>

        <p className="mb-3 text-gray-700">
          We’ve sent a verification link to your CvSU email address.
        </p>

        <p className="mb-3 text-gray-700">
          Please check your inbox and spam folder. Click the link in the email to complete your registration.
        </p>

        <p className="mb-6 text-gray-600 text-sm">
          The email was sent by the authentication service for this site using the project’s email settings. If you don’t see the email, wait a few minutes or request a new one from the sign-in page.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Back to sign in
          </Link>

          <Link href="/" className="text-sm text-gray-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
