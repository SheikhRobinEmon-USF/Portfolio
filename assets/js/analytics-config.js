/*
 * Visit analytics settings.
 *
 * Fill in the two values from your Firebase project (Project settings > General > Your apps).
 * They are public client settings, not secrets: who can READ the data is decided by the
 * Firestore security rules in firebase/firestore.rules, which allow only your account.
 *
 * While projectId or apiKey is empty, the site records nothing and the dashboard offers
 * sample data instead. See ANALYTICS.md for the five-minute setup.
 */
window.ANALYTICS_CONFIG = {
  projectId: "",
  apiKey: "",

  // Record visits made from localhost and file:// pages too. Leave false.
  trackLocal: false
};
