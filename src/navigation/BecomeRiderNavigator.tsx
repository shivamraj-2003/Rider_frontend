import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BecomeRiderWizardProvider } from '../context/BecomeRiderWizardContext';
import BecomeRiderIntroScreen from '../screens/rider/onboarding/BecomeRiderIntroScreen';
import RiderVehicleDetailsScreen from '../screens/rider/onboarding/RiderVehicleDetailsScreen';
import RiderDocumentsScreen from '../screens/rider/onboarding/RiderDocumentsScreen';
import RiderBankDetailsScreen from '../screens/rider/onboarding/RiderBankDetailsScreen';
import RiderReviewScreen from '../screens/rider/onboarding/RiderReviewScreen';

export type BecomeRiderStackParamList = {
  Intro: undefined;
  VehicleDetails: undefined;
  Documents: undefined;
  BankDetails: undefined;
  Review: undefined;
};

const Stack = createNativeStackNavigator<BecomeRiderStackParamList>();

// Mounted directly by PostAuthGate when a customer-role account with no
// RiderProfile picks "Rider" at login - there is no other entry point into
// this flow. The wizard provider lives here so its state resets every time
// someone re-enters it, and is gone the moment they leave.
export default function BecomeRiderNavigator() {
  return (
    <BecomeRiderWizardProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Intro" component={BecomeRiderIntroScreen} />
        <Stack.Screen name="VehicleDetails" component={RiderVehicleDetailsScreen} />
        <Stack.Screen name="Documents" component={RiderDocumentsScreen} />
        <Stack.Screen name="BankDetails" component={RiderBankDetailsScreen} />
        <Stack.Screen name="Review" component={RiderReviewScreen} />
      </Stack.Navigator>
    </BecomeRiderWizardProvider>
  );
}
