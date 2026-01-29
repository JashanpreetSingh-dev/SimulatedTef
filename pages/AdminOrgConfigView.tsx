import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService, OrgConfig } from '../services/adminService';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '@clerk/clerk-react';

export function AdminOrgConfigView() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  
  const [config, setConfig] = useState<OrgConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [sectionALimit, setSectionALimit] = useState<number>(45);
  const [sectionBLimit, setSectionBLimit] = useState<number>(45);
  const [validationErrors, setValidationErrors] = useState<{
    sectionALimit?: string;
    sectionBLimit?: string;
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
    // Reset state when org changes
    setConfig(null);
    setSectionALimit(45); // Reset to default
    setSectionBLimit(45); // Reset to default
    setError(null);
    setSuccess(false);
    setValidationErrors({});
    fetchConfig();
  }, [isAdmin, navigate, organization?.id]);

  const fetchConfig = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      // Pass explicit orgId to ensure we get the right org's config
      const data = await adminService.getOrgConfig(getToken, organization?.id);
      setConfig(data);
      setSectionALimit(data.sectionALimit);
      setSectionBLimit(data.sectionBLimit);
    } catch (err: any) {
      console.error('❌ Failed to fetch org config:', err);
      setError(err.message || 'Failed to load organization configuration');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { sectionALimit?: string; sectionBLimit?: string } = {};

    if (isNaN(sectionALimit) || sectionALimit < 1) {
      errors.sectionALimit = 'Section A limit must be at least 1';
    }

    if (isNaN(sectionBLimit) || sectionBLimit < 1) {
      errors.sectionBLimit = 'Section B limit must be at least 1';
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

      // Pass explicit orgId to ensure we update the right org's config
      const updated = await adminService.updateOrgConfig(getToken, {
        sectionALimit,
        sectionBLimit,
      }, organization?.id);

      setConfig(updated);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Failed to update org config:', err);
      setError(err.message || 'Failed to update organization configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && !config) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">
            {t('admin.loadingConfig') || 'Loading configuration...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        <div className="space-y-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('admin.orgConfigTitle') || 'Organization Settings'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('admin.orgConfigSubtitle') || 'Configure monthly usage limits for Section A and Section B speaking attempts'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {t('admin.configSaved') || 'Configuration saved successfully!'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* Config Form */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4">
              <div className="space-y-4">
                {/* Section A Limit */}
                <div>
                  <label 
                    htmlFor="sectionALimit" 
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    {t('admin.sectionALimit') || 'Section A Monthly Limit'}
                  </label>
                  <input
                    type="number"
                    id="sectionALimit"
                    min="1"
                    value={sectionALimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setSectionALimit(isNaN(value) ? 0 : value);
                      if (validationErrors.sectionALimit) {
                        setValidationErrors(prev => ({ ...prev, sectionALimit: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border ${
                      validationErrors.sectionALimit
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400`}
                    disabled={saving}
                  />
                  {validationErrors.sectionALimit && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.sectionALimit}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.sectionALimitDesc') || 'Maximum number of Section A speaking attempts per user per month'}
                  </p>
                </div>

                {/* Section B Limit */}
                <div>
                  <label 
                    htmlFor="sectionBLimit" 
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    {t('admin.sectionBLimit') || 'Section B Monthly Limit'}
                  </label>
                  <input
                    type="number"
                    id="sectionBLimit"
                    min="1"
                    value={sectionBLimit}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setSectionBLimit(isNaN(value) ? 0 : value);
                      if (validationErrors.sectionBLimit) {
                        setValidationErrors(prev => ({ ...prev, sectionBLimit: undefined }));
                      }
                    }}
                    className={`w-full px-3 py-2 rounded border ${
                      validationErrors.sectionBLimit
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400`}
                    disabled={saving}
                  />
                  {validationErrors.sectionBLimit && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {validationErrors.sectionBLimit}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.sectionBLimitDesc') || 'Maximum number of Section B speaking attempts per user per month'}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={saving || sectionALimit < 1 || sectionBLimit < 1}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      {t('admin.saving') || 'Saving...'}
                    </>
                  ) : (
                    t('admin.save') || 'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-2">
              {t('admin.aboutLimits') || 'About Monthly Limits'}
            </h3>
            <ul className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1 list-disc list-inside">
              <li>{t('admin.limitInfo1') || 'Limits apply per user, not per organization'}</li>
              <li>{t('admin.limitInfo2') || 'Counters reset automatically at the start of each calendar month'}</li>
              <li>{t('admin.limitInfo3') || 'Full exams count as 1 Section A + 1 Section B usage'}</li>
              <li>{t('admin.limitInfo4') || 'Users cannot exceed their monthly limit'}</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
