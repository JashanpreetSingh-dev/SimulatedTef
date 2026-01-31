import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { subscriptionService } from '../../services/subscriptionService';

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  currency: string;
  status: string;
  date: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

interface PaymentMethod {
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
}

interface BillingHistoryData {
  invoices: Invoice[];
  paymentMethod: PaymentMethod | null;
}

export function BillingHistory() {
  const { getToken } = useAuth();
  const [billingData, setBillingData] = useState<BillingHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getBillingHistory(getToken);
      setBillingData(data);
    } catch (err: any) {
      console.error('Failed to load billing history:', err);
      setError(err.message || 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'open':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'void':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'uncollectible':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCardBrandName = (brand?: string): string => {
    const brandMap: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      jcb: 'JCB',
      diners: 'Diners Club',
      unionpay: 'UnionPay',
    };
    return brandMap[brand?.toLowerCase() || ''] || brand || 'Card';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!billingData) {
    return null;
  }

  const { invoices, paymentMethod } = billingData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Billing History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          View and download your invoices, manage your payment method.
        </p>
      </div>

      {/* Payment Method Section */}
      {paymentMethod ? (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Payment Method
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {getCardBrandName(paymentMethod.brand)} •••• {paymentMethod.last4}
            </span>
            {paymentMethod.expMonth && paymentMethod.expYear && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Update your payment method in the Stripe customer portal
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No payment method on file. Add one when you upgrade your plan.
          </p>
        </div>
      )}

      {/* Invoices Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invoices
        </h3>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No invoices yet. Invoices will appear here after your first payment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusBadgeColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(invoice.date)} • {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {invoice.hostedInvoiceUrl && (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      View
                    </a>
                  )}
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
