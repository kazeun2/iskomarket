// Feature flags to show/hide admin UI elements.
// Defaults are set to false so features are hidden unless explicitly enabled.
export const adminFlags = {
  // Overview stat cards
  pendingReports: false,
  todaysActivity: false,
  flaggedUsers: false,
  appeals: false,
  seasonReset: false,

  // Tabs
  activitiesTab: false,

  // Quick actions
  quickActions: false,
  auditLogs: false,
  manageInactive: false,

  // Navbar / profile
  navbarNotifications: false,
  profileDeleteAccount: false,
};
