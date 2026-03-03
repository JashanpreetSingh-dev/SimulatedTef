import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import LogRocket from 'logrocket';

/**
 * Calls LogRocket.identify when a Clerk user is signed in so sessions
 * are searchable by user in the LogRocket dashboard.
 */
export function LogRocketIdentify() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    LogRocket.identify(user.id, {
      name: user.fullName ?? undefined,
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
    });
  }, [user?.id, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  return null;
}
