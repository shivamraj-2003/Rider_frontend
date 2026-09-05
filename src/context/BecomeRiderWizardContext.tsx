import React, { createContext, useContext, useMemo, useState, PropsWithChildren } from 'react';
import type { VehicleType } from '../types';

export interface PickedDocument {
  uri: string;
  mimeType: string;
}

interface WizardState {
  vehicle_type: VehicleType;
  vehicle_number: string;
  vehicle_model: string;
  licence_number: string;
  licenceDoc: PickedDocument | null;
  rcDoc: PickedDocument | null;
  bank_account_holder: string;
  bank_account_number: string;
  bank_ifsc: string;
}

const initialState: WizardState = {
  vehicle_type: 'bike',
  vehicle_number: '',
  vehicle_model: '',
  licence_number: '',
  licenceDoc: null,
  rcDoc: null,
  bank_account_holder: '',
  bank_account_number: '',
  bank_ifsc: '',
};

interface WizardContextValue {
  data: WizardState;
  update: (patch: Partial<WizardState>) => void;
  reset: () => void;
}

const BecomeRiderWizardContext = createContext<WizardContextValue | undefined>(undefined);

// Local-only form state across the 5-step "Become a Rider" wizard — nothing
// here is submitted until RiderReviewScreen's final POST /riders/onboard.
export function BecomeRiderWizardProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<WizardState>(initialState);

  const value = useMemo(
    () => ({
      data,
      update: (patch: Partial<WizardState>) => setData((prev) => ({ ...prev, ...patch })),
      reset: () => setData(initialState),
    }),
    [data]
  );

  return <BecomeRiderWizardContext.Provider value={value}>{children}</BecomeRiderWizardContext.Provider>;
}

export function useBecomeRiderWizard() {
  const ctx = useContext(BecomeRiderWizardContext);
  if (!ctx) throw new Error('useBecomeRiderWizard must be used within a BecomeRiderWizardProvider');
  return ctx;
}
