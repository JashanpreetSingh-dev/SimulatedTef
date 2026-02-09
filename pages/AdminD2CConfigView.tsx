import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService, D2CConfig } from '../services/adminService';
import { useLanguage } from '../contexts/LanguageContext';

export function AdminD2CConfigView() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [config, setConfig] = useState<D2CConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state - writtenExpressionLimit applies to both Section A and B (same value)
  const [sectionALimit, setSectionALimit] = useState<number>(1);
  const [sectionBLimit, setSectionBLimit] = useState<number>(1);
  const [writtenExpressionLimit, setWrittenExpressionLimit] = useState<number>(1);
  const [mockExamLimit, setMockExamLimit] = useState<number>(1);
  const [validationErrors, setValidationErrors] = useState<{
    sectionALimit?: string;
    sectionBLimit?: string;
    writtenExpressionLimit?: string;
    mockExamLimit?: string;
  }>({});

  // Check if user is admin
  const isAdmin = user?.organizationMemberships?.some(
    (membership) => membership.role === 'org:admin'
  ) ?? false;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchConfig();
  }, [isAdmin, navigate]);

  const fetchConfig = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getD2CConfig(getToken);
      setConfig(data);
      setSectionALimit(data.sectionALimit);
      setSectionBLimit(data.sectionBLimit);
      setWrittenExpressionLimit(data.writtenExpressionSectionALimit ?? data.writtenExpressionSectionBLimit ?? 1);
      setMockExamLimit(data.mockExamLimit);
    } catch (err: any) {
      console.error('❌ Failed to fetch D2C config:', err);
      setError(err.message || 'Failed to load D2C configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      sectionALimit?: string;
      sectionBLimit?: string;
      writtenExpressionLimit?: string;
      mockExamLimit?: string;
    } = {};

    if (isNaN(sectionALimit) || sectionALimit < 0) {
      errors.sectionALimit = 'Section A limit must be at least 0';
    }

    if (isNaN(sectionBLimit) || sectionBLimit < 0) {
      errors.sectionBLimit = 'Section B limit must be at least 0';
    }

    if (writtenExpressionLimit !== -1 && (isNaN(writtenExpressionLimit) || writtenExpressionLimit < 0)) {
      errors.writtenExpressionLimit = 'Written expression limit must be -1 (unlimited) or at least 0';
    }

    if (isNaN(mockExamLimit) || mockExamLimit < 0) {
      errors.mockExamLimit = 'Mock exam limit must be at least 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const updated = await adminService.updateD2CConfig(getToken, {
        sectionALimit,
        sectionBLimit,
        writtenExpressionSectionALimit: writtenExpressionLimit,
        writtenExpressionSectionBLimit: writtenExpressionLimit,
        mockExamLimit,
      });

      setConfig(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Failed to update D2C config:', err);
      setError(err.message || 'Failed to update D2C configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading D2C configuration...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            D2C Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure default usage limits for Direct-to-Consumer (D2C) users (Free tier baseline).
            These limits apply to users without organization membership.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">
              ✅ D2C configuration updated successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section A Limit (per month)
              </label>
              <input
                type="number"
                min="0"
                value={sectionALimit}
                onChange={(e) => setSectionALimit(parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.sectionALimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.sectionALimit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.sectionALimit}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of Section A attempts per month for D2C users (Free tier baseline)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section B Limit (per month)
              </label>
              <input
                type="number"
                min="0"
                value={sectionBLimit}
                onChange={(e) => setSectionBLimit(parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.sectionBLimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.sectionBLimit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.sectionBLimit}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of Section B attempts per month for D2C users (Free tier baseline)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Written Expression Limit (per month, applies to both Section A and B)
              </label>
              <input
                type="number"
                min="-1"
                value={writtenExpressionLimit}
                onChange={(e) => setWrittenExpressionLimit(parseInt(e.target.value) || -1)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.writtenExpressionLimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.writtenExpressionLimit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.writtenExpressionLimit}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Use -1 for unlimited. This value applies to both Written Expression Section A and Section B.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mock Exam Limit (per month)
              </label>
              <input
                type="number"
                min="0"
                value={mockExamLimit}
                onChange={(e) => setMockExamLimit(parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  validationErrors.mockExamLimit ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.mockExamLimit && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.mockExamLimit}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Maximum number of mock exams per month for D2C users (Free tier baseline)
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
