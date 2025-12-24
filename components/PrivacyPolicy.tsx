import React from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { DashboardLayout } from '../App';
import { Footer } from './Footer';

function PrivacyPolicyContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6 md:p-10 lg:p-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">1. Information Collection</h2>
              <p>
                We collect information that you provide directly to us and information collected automatically through your use of our service.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Information Provided by You</h3>
              <p>
                When you create an account through Clerk authentication, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email address</li>
                <li>Name (first name and last name)</li>
                <li>User ID (provided by Clerk)</li>
              </ul>
              <p className="mt-4">
                Clerk handles the authentication process and securely stores your login credentials. We do not have access to your password.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">2. Audio Recording Collection and Storage</h2>
              <p>
                When you use our exam simulation service, we collect and store audio recordings of your oral expression exercises. These recordings are:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Recorded during your exam sessions</li>
                <li>Stored securely in our MongoDB database</li>
                <li>Used solely for evaluation purposes and to provide you with exam results</li>
                <li>Associated with your user account and exam results</li>
              </ul>
              <p className="mt-4">
                You can access and review your recordings through your account dashboard. Recordings are retained according to our data retention policy outlined below.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">3. Data Processing</h2>
              <p>
                Your audio recordings are processed using Google Gemini AI for evaluation purposes. The AI system:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Analyzes your oral expression based on the CCI Paris framework</li>
                <li>Generates CLB (Canadian Language Benchmark) and TEF scores</li>
                <li>Provides detailed feedback on your performance</li>
                <li>Processes data in accordance with Google's privacy policies</li>
              </ul>
              <p className="mt-4">
                We do not use your audio recordings for training AI models or any purpose other than providing you with evaluation results.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">4. Data Storage</h2>
              <p>
                We store your data in MongoDB, a secure cloud database service. The following information is stored:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Exam results (scores, evaluations, feedback)</li>
                <li>Audio recordings associated with exam sessions</li>
                <li>Usage tracking data (exam attempts, subscription status)</li>
                <li>Account information (email, name, user ID)</li>
              </ul>
              <p className="mt-4">
                All data is encrypted in transit and at rest. We implement industry-standard security measures to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">5. Payment Information</h2>
              <p>
                Payment processing is handled entirely by Stripe, a third-party payment processor. We do not:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Store your payment card information</li>
                <li>Have access to your full payment card details</li>
                <li>Process payments directly</li>
              </ul>
              <p className="mt-4">
                Stripe handles all payment transactions securely. We only receive confirmation of successful payments and subscription status updates. Your payment information is subject to Stripe's privacy policy and terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">6. Data Usage</h2>
              <p>
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Provide and improve our exam simulation service</li>
                <li>Generate and display your exam results</li>
                <li>Track your progress and exam history</li>
                <li>Manage your subscription and usage limits</li>
                <li>Send you service-related communications (if applicable)</li>
                <li>Respond to your inquiries and provide customer support</li>
              </ul>
              <p className="mt-4">
                We do not sell, rent, or share your personal information with third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">7. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide you with our services. Specifically:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Exam results and recordings are retained while your account is active</li>
                <li>Account information is retained until you request account deletion</li>
                <li>Usage tracking data may be retained for analytical purposes</li>
              </ul>
              <p className="mt-4">
                You may request deletion of your data at any time by contacting us or deleting your account. We will delete your data in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">8. User Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us through your account dashboard or the contact information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">9. Third-Party Services</h2>
              <p>
                We use the following third-party services that may have access to your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Clerk:</strong> Handles user authentication and account management. See Clerk's privacy policy for details.</li>
                <li><strong>Google Gemini:</strong> Processes audio recordings for AI evaluation. See Google's privacy policy for details.</li>
                <li><strong>Stripe:</strong> Processes payments and subscription management. See Stripe's privacy policy for details.</li>
                <li><strong>MongoDB:</strong> Provides secure cloud database storage. See MongoDB's privacy policy for details.</li>
              </ul>
              <p className="mt-4">
                These third-party services have their own privacy policies and terms of service. We encourage you to review them to understand how they handle your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">10. Security Measures</h2>
              <p>
                We implement various security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Encryption of data in transit using HTTPS/TLS</li>
                <li>Encryption of data at rest in our databases</li>
                <li>Secure authentication through Clerk</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">11. Children's Privacy</h2>
              <p>
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">12. Policy Updates</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Posting the updated policy on this page</li>
                <li>Updating the "Last updated" date at the top of this policy</li>
                <li>Notifying you through your account dashboard or email (if significant changes occur)</li>
              </ul>
              <p className="mt-4">
                Your continued use of the service after changes to this Privacy Policy constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-4">13. Contact Information</h2>
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us through your account dashboard or by using the contact information provided in our Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
  );
}

export const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <PrivacyPolicyContent />
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-slate-950 flex flex-col">
          <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-4 flex justify-between items-center">
            <span className="font-black text-lg text-white">Akseli</span>
          </div>
          <div className="flex-1">
            <PrivacyPolicyContent />
          </div>
          <Footer variant="dark" />
        </div>
      </SignedOut>
    </>
  );
};

