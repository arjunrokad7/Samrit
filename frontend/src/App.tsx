import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, AuthPage } from "./samrit/Auth";
import Landing from "./samrit/Landing";
import Workspace from "./samrit/Workspace";
import Consumer from "./samrit/Consumer";
import Legal from "./samrit/Legal";
import ConsumerCheckIn from "./samrit/ConsumerCheckIn";
import { ui } from "./samrit/design";
import { ThemeProvider, ThemeToggle, useTheme } from "./samrit/Theme";
import { DEMO_LOCATION_MODE } from "./samrit/location";
function Notifications() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-right" richColors closeButton />;
}
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className={ui("sr-design")}>
            <Notifications />
            <ThemeToggle />
            {DEMO_LOCATION_MODE && (
              <div
                role="note"
                className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800"
              >
                Demo location mode · Sample coordinates · GPS proximity is not
                verified
              </div>
            )}
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage register />} />
              <Route path="/consumer" element={<Consumer />} />
              <Route path="/consumer/check-in" element={<ConsumerCheckIn />} />
              <Route path="/terms" element={<Legal />} />
              <Route path="/regulations" element={<Legal regulations />} />
              <Route path="/dashboard/*" element={<Workspace />} />
              <Route
                path="/admin-dashboard"
                element={<Navigate to="/dashboard?view=dispatch" replace />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
