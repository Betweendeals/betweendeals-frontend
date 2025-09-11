// 🚀 Clean Modern App Component - 2026 Architecture
import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';

/**
 * Clean App Component
 * - Single responsibility: Render router and handle app initialization
 * - No routing logic (moved to router.tsx)
 * - No layout logic (moved to app-layout.tsx)
 * - No modal logic (moved to app-layout.tsx)
 * - Clean separation of concerns
 */
export const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 Flyp App initializing...');

    const initializeApp = async () => {
      try {
        // Basic app initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('✅ Flyp App ready');
      } catch (error) {
        console.error('❌ Flyp App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  // Clean, simple render - all complexity moved to dedicated files
  return <RouterProvider router={router} />;
};

export default App;
