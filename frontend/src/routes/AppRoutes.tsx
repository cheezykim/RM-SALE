import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { useBootstrap, useUpdatePotential } from "../hooks/useCrmData";
import { useSessionStore } from "../store/sessionStore";
import { Login } from "../components/Login";
import { Analytics } from "../pages/Analytics";
import { DailyPlanning } from "../pages/DailyPlanning";
import { Dashboard } from "../pages/Dashboard";
import { MarketVisit } from "../pages/MarketVisit";
import { PotentialCustomers } from "../pages/PotentialCustomers";
import { Reports } from "../pages/Reports";
import { SettingsPage } from "../pages/SettingsPage";

export function AppRoutes() {
  const user = useSessionStore((state) => state.user);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedRoutes />;
}

function AuthenticatedRoutes() {
  const user = useSessionStore((state) => state.user)!;
  const { data, isLoading, error } = useBootstrap(user);
  const updatePotential = useUpdatePotential(user);

  const loading = <div className="crm-card p-8 text-center text-sm font-bold text-muted">Loading CRM data...</div>;
  const errorBlock = error ? <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error.message}</div> : null;

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<AppLayout user={user} active="Dashboard">{errorBlock}{isLoading || !data ? loading : <Dashboard dashboard={data.dashboard} />}</AppLayout>} />
      <Route path="/daily-planning" element={<AppLayout user={user} active="Daily Planning">{errorBlock}{isLoading || !data ? loading : <DailyPlanning user={user} initialTasks={data.dailyTasks} />}</AppLayout>} />
      <Route path="/market-visit-customers" element={<AppLayout user={user} active="Market Visit Customers">{errorBlock}{isLoading || !data ? loading : <MarketVisit user={user} visits={data.visits} />}</AppLayout>} />
      <Route
        path="/potential-customers"
        element={
          <AppLayout user={user} active="My Potential Customers">
            {errorBlock}
            {isLoading || !data ? (
              loading
            ) : (
              <PotentialCustomers
                user={user}
                potentials={data.potentials}
                onSave={async (customer, updates) => {
                  await updatePotential.mutateAsync({ rowNumber: customer._row_number, updates });
                }}
              />
            )}
          </AppLayout>
        }
      />
      <Route path="/performance-analytics" element={<AppLayout user={user} active="Performance Analytics">{errorBlock}{isLoading || !data ? loading : <Analytics visits={data.visits} potentials={data.potentials} />}</AppLayout>} />
      <Route
        path="/reports"
        element={
          <AppLayout user={user} active="Reports">
            {errorBlock}
            {isLoading || !data ? (
              loading
            ) : (
              <Reports
                user={user}
                visits={data.visits}
                potentials={data.potentials}
                onSave={async (customer, updates) => {
                  await updatePotential.mutateAsync({ rowNumber: customer._row_number, updates });
                }}
              />
            )}
          </AppLayout>
        }
      />
      <Route path="/settings" element={<AppLayout user={user} active="Settings">{errorBlock}<SettingsPage user={user} /></AppLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
