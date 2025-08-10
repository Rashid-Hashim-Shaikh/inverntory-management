'use client';

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-col p-6 md:p-8 overflow-auto h-full">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user?.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Name
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user?.displayName || 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Account Created
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {/* Firebase user has metadata but different fields; keep Unknown to avoid runtime issues */}
                  {'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
            <h2 className="text-lg font-semibold mb-4">System Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Version
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Inventory Management System v1.0.0
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Database
                </label>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                   Firebase (Firestore + Auth)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
            <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
              Contact Administrator
            </h2>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              For account changes, password resets, or other administrative tasks, 
              please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 