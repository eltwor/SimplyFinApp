import './App.css'
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { DataRefreshProvider } from './contexts/DataRefreshContext';
import RootPage from './pages/RootPage';
import LoginPage from './pages/Login';
import DashPage from "./pages/DashPage"
import RegisterPage from './pages/Register';
import ExpensesPage from './pages/ExpensesPage';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import IncomePage from './pages/IncomePage';
import SavingsPage from './pages/SavingsPage';

const router = createBrowserRouter([
  {
    index: true, element: <PublicRoute>
      <RootPage />
    </PublicRoute>
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    )
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    )
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/expenses",
    element: (
      <ProtectedRoute>
        <ExpensesPage />
      </ProtectedRoute>
    )
  },
  {
    path: "/income",
    element: (
      <ProtectedRoute>
        <IncomePage />
      </ProtectedRoute>
    )
  },
    {
    path: "/savings",
    element: (
      <ProtectedRoute>
        <SavingsPage />
      </ProtectedRoute>
    )
  },
])


function App() {
  return <DataRefreshProvider>
    <RouterProvider router={router} />
  </DataRefreshProvider>
}

export default App
