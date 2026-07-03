/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useStore } from './store';
import { Dashboard } from './components/Dashboard';
import { RequestWizard } from './components/RequestWizard';

export default function App() {
  const { activeRequestId, fetchRequests } = useStore();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0 print:m-0">
        {activeRequestId ? (
          <div className="h-[calc(100vh-10rem)] print:h-auto print:overflow-visible bg-white rounded-xl shadow-lg border border-gray-200 print:border-none print:shadow-none print:rounded-none overflow-hidden">
             <RequestWizard />
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}

