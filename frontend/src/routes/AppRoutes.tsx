import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { useBootstrap, useUpdatePotential } from "../hooks/useCrmData";
import { useSessionStore } from "../store/sessionStore";
import { Login } from "../components/Login";
import { DailyPlanning } from "../pages/DailyPlanning";
import { ExistingCustomers } from "../pages/ExistingCustomers";
import { MarketVisit } from "../pages/MarketVisit";
import { MyMerchant } from "../pages/MyMerchant";
import { PotentialCustomers } from "../pages/PotentialCustomers";

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
      <Route path="/login" element={<Navigate to="/daily-planning" replace />} />
      <Route path="/" element={<Navigate to="/daily-planning" replace />} />
      <Route path="/daily-planning" element={<AppLayout user={user} active="Daily Planning">{errorBlock}{isLoading || !data ? loading : <DailyPlanning user={user} initialTasks={data.dailyTasks} />}</AppLayout>} />
      <Route path="/my-merchant" element={<AppLayout user={user} active="MyMerchant">{errorBlock}<MyMerchant /></AppLayout>} />
      <Route path="/existing-customers" element={<AppLayout user={user} active="Existing Customers">{errorBlock}<ExistingCustomers /></AppLayout>} />
      <Route path="/market-visit-customers" element={<AppLayout user={user} active="Market Visit Customers">{errorBlock}{isLoading || !data ? loading : <MarketVisit user={user} visits={data.visits} />}</AppLayout>} />
      <Route
        path="/potential-customers"
        element={
          <AppLayout user={user} active="My Followup">
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
      <Route path="*" element={<Navigate to="/daily-planning" replace />} />
    </Routes>
  );
}
