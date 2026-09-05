// AsyncStorage keys for non-sensitive local UI state. Anything security-
// sensitive (tokens) lives in SecureStore via services/api.ts instead.
export const ONBOARDING_SEEN_KEY = 'top_rider.onboarding_seen';

// Set once the customer has seen the pre-permission location explainer (either
// responded to the OS dialog or picked "enter address manually"), so it isn't
// shown on every launch.
export const LOCATION_PROMPT_DONE_KEY = 'top_rider.location_prompt_done';
