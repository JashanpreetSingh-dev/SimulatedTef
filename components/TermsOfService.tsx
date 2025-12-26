import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { DashboardLayout } from '../App';
import { Footer } from './Footer';

function TermsOfServiceContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="bg-indigo-100/50 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 md:p-10 lg:p-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-800 mb-2 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">1. Service Description</h2>
              <p>
                Akseli provides a TEF Canada exam simulation service designed to help candidates prepare for Canadian immigration. Our service includes AI-powered evaluation of oral expression exercises based on the official CCI Paris framework, providing CLB (Canadian Language Benchmark) and TEF scores.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">2. User Accounts and Responsibilities</h2>
              <p>
                To use our service, you must create an account through Clerk authentication. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information during registration</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">3. Subscription Terms and Payment Processing</h2>
              <p>
                Our service offers various subscription plans and exam packs. Payment processing is handled by Stripe, a third-party payment processor. By making a purchase, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Pay all fees associated with your subscription or pack purchase</li>
                <li>Abide by Stripe's terms of service and privacy policy</li>
                <li>Understand that payments are processed securely through Stripe and we do not store your payment card information</li>
                <li>Accept that all fees are non-refundable unless otherwise stated or required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">4. Trial Periods and Pack Purchases</h2>
              <p>
                We may offer free trial periods for new users. Trial periods are subject to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Daily usage limits as specified at the time of trial activation</li>
                <li>Automatic expiration after the trial period ends</li>
                <li>Conversion to a paid subscription if you choose to continue using the service</li>
              </ul>
              <p className="mt-4">
                Exam packs provide a fixed number of exam attempts and have expiration dates. Pack credits are non-transferable and non-refundable.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">5. Usage Limits and Restrictions</h2>
              <p>
                Your usage of the service is subject to limits based on your subscription type or pack credits. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Attempt to circumvent usage limits or restrictions</li>
                <li>Share your account with others or allow multiple users to access your account</li>
                <li>Use automated systems or bots to interact with the service</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">6. AI Evaluation Disclaimers</h2>
              <p>
                Our AI-powered evaluation system uses Google Gemini and is trained on the CCI Paris framework. However:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>AI evaluations are provided for practice purposes only and are not official TEF Canada exam results</li>
                <li>While we strive for accuracy, AI evaluations may not perfectly reflect official exam scoring</li>
                <li>Actual TEF Canada exam results may differ from our AI evaluations</li>
                <li>We are not affiliated with or endorsed by CCI Paris or the official TEF Canada exam administrators</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">7. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the service, including but not limited to text, graphics, logos, and software, are owned by Akseli or its licensors and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="mt-4">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise exploit any content from our service without express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>The service is provided "as is" and "as available" without warranties of any kind</li>
                <li>We do not guarantee that the service will be uninterrupted, secure, or error-free</li>
                <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">9. Service Modifications</h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. We may also update these Terms of Service from time to time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">10. Account Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may terminate your account at any time by contacting us or through your account settings. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Your right to use the service will immediately cease</li>
                <li>We may delete your account and associated data, subject to our Privacy Policy</li>
                <li>Any unused subscription time or pack credits will be forfeited</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4">11. Contact Information</h2>
              <p>
                If you have questions about these Terms of Service, please contact us through your account dashboard or the contact information provided in our Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
  );
}

export const TermsOfService: React.FC = () => {
  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <TermsOfServiceContent />
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-indigo-100 flex flex-col">
          <div className="sticky top-0 z-50 bg-indigo-100/50/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex justify-between items-center">
            <span className="font-black text-lg text-slate-800">Akseli</span>
          </div>
          <div className="flex-1">
            <TermsOfServiceContent />
          </div>
          <Footer variant="light" />
        </div>
      </SignedOut>
    </>
  );
};

