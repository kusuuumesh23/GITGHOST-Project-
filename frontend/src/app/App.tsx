import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ConsentProvider } from './ConsentContext';
import { ConsentModalWrapper } from './ConsentModalWrapper';

export const App: React.FC = () => {
  return (
    <ConsentProvider>
      <ConsentModalWrapper />
      <RouterProvider router={router} />
    </ConsentProvider>
  );
};

export default App;
