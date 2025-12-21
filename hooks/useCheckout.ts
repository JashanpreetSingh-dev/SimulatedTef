import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export type PlanType = 'monthly' | 'yearly' | 'pack';

export const useCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  const initiateCheckout = async (planType: PlanType) => {
    if (!isSignedIn) {
      // For signed-out users, we'll handle this in the component
      // by showing sign-up modal first
      return { requiresAuth: true };
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.sessionId) {
        // If using Stripe.js, load checkout session
        // For now, we'll use redirect URL
        window.location.href = data.url;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { initiateCheckout, loading, isSignedIn };
};

