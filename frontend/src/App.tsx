import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, AuthPage } from "./samrit/Auth";
import Landing from "./samrit/Landing";
import Workspace from "./samrit/Workspace";
import Consumer from "./samrit/Consumer";
import Legal from "./samrit/Legal";
import ConsumerCheckIn from "./samrit/ConsumerCheckIn";
import { ui } from "./samrit/design";
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className={ui("sr-design")}>
          <Toaster position="top-right" richColors closeButton />
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
  );
}
