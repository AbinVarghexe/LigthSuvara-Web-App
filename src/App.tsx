import { RouterProvider } from 'react-router';
import { router } from './utils/routes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </>
  );
}
