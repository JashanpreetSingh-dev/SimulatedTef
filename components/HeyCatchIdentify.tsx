import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { analytics } from '@heycatch/sdk';

export function HeyCatchIdentify() {
  const { user } = useUser();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = user?.id ?? null;

    if (user) {
      analytics.setIdentity(user.id, {
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
        name: user.fullName ?? undefined,
      });
    } else if (prevUserId) {
      analytics.resetIdentity();
    }
  }, [user?.id, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  return null;
}
