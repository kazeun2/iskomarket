# Maintenance Mode (Admin Guide)

This repository supports a Supabase-backed maintenance window system that allows admins to schedule maintenance or alerts which are displayed to users in real time.

Key points
- Admins can schedule maintenance via **Admin Dashboard → Quick Actions → System Alert** (choose Maintenance type and set Start/End).
- When active, normal users see a full-screen, non-interactive overlay blocking the app; admins see a small top banner and can continue working.
- Admins can cancel an active maintenance window from the Quick Actions panel (cancel button appears when active).
- The system creates notifications for users when maintenance windows are created.

Database / Migrations
- Ensure the following migrations are applied in your database deployment:
  - `migrations/20260106-add-maintenance-windows.sql` (creates `maintenance_windows` table)
  - `migrations/20260108-maintenance-windows-rls.sql` (enables RLS and restricts writes to admin users)

Server-side access
- The RLS policies restrict INSERT/UPDATE/DELETE on `maintenance_windows` to authenticated users where `users.is_admin = true`.
- The public role is allowed to SELECT active maintenance rows so the front-end can read the active window.

Testing and verification
- Unit tests available: `tests/maintenanceOverlay.test.tsx` and `tests/SystemAlertModal.*.test.tsx`.
- To test manually: schedule a maintenance window starting now and ending in the near future, then open the site in an incognito window (non-admin) - you should see the overlay.

Notes
- The maintenance system also supports an `alert` type which shows a non-blocking top banner to all users.
- The `createMaintenanceWindow` service attempts to notify users and write an admin audit log; failures in those subsystems are non-fatal and do not block the maintenance creation.
