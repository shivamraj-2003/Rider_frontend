import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRiderMe } from '../services/rider';
import SplashScreen from '../screens/auth/SplashScreen';
import BecomeRiderNavigator from './BecomeRiderNavigator';
import CustomerNavigator from './CustomerNavigator';
import RiderNavigator from './RiderNavigator';
import AdminNavigator from './AdminNavigator';

type Phase = 'reconciling' | 'onboarding' | 'done';

// Runs once, right after a fresh sign-in, to reconcile the User/Rider choice
// made on PhoneLoginScreen (`intendedRole`) with the account's actual
// role/profile state — then hands off to the matching navigator:
//
//   picked "User"  -> ensure role=customer, show CustomerNavigator.
//   picked "Rider" -> has a RiderProfile? ensure role=rider, show
//                     RiderNavigator (its own gate handles pending/approved/
//                     rejected/suspended). No profile yet? go straight into
//                     the Become-a-Rider wizard - there is no other entry
//                     point into it any more.
//
// A restored session (cold start) never sets `intendedRole`, so a returning
// user just resumes whatever role they left the app in - no forced switch.
export default function PostAuthGate() {
  const { user, intendedRole, switchRole } = useAuth();
  const [phase, setPhase] = useState<Phase>(intendedRole ? 'reconciling' : 'done');

  useEffect(() => {
    if (phase !== 'reconciling' || !user) return;
    let cancelled = false;

    (async () => {
      if (user.role === 'admin' || intendedRole == null) {
        if (!cancelled) setPhase('done');
        return;
      }

      if (intendedRole === 'rider') {
        const rider = await getRiderMe().catch(() => null);
        if (cancelled) return;
        if (!rider) {
          setPhase('onboarding');
          return;
        }
        if (user.role !== 'rider') await switchRole('rider');
      } else if (user.role !== 'customer') {
        await switchRole('customer');
      }

      if (!cancelled) setPhase('done');
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, user, intendedRole, switchRole]);

  // The wizard flips role to 'rider' server-side on submit and calls
  // refreshUser() - once that lands, fall through to the normal navigators.
  useEffect(() => {
    if (phase === 'onboarding' && user?.role === 'rider') setPhase('done');
  }, [phase, user?.role]);

  // The wizard's Intro screen has no parent stack to "go back" to (it's
  // mounted standalone right here) - its back button instead flips
  // `intendedRole` to 'customer', which this re-runs reconciliation on.
  useEffect(() => {
    if (phase === 'onboarding' && intendedRole === 'customer') setPhase('reconciling');
  }, [phase, intendedRole]);

  if (phase === 'reconciling') return <SplashScreen />;
  if (phase === 'onboarding') return <BecomeRiderNavigator />;

  if (!user) return <SplashScreen />;
  if (user.role === 'customer') return <CustomerNavigator />;
  if (user.role === 'rider') return <RiderNavigator />;
  return <AdminNavigator />;
}
