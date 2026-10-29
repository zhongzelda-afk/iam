// I.A.M. site settings.
// Paste the two values from Supabase (Project Settings > API) to switch on the shared archive.
// Leave them empty and the site still works: entries are kept in the visitor's own browser.
// The anon key is designed to be public. Never paste the service_role key here.
window.IAM_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  // Optional looping film for the homepage hero, e.g. "assets/hero.mp4" (keep it short, muted, under 8 MB)
  HERO_VIDEO: ""
};
