import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RoleBoundary, SubscriptionBoundary } from "./auth/ProtectedRoute";
import { ROUTE_PATHS, USER_ROLES } from "./app/routes";
import { PublicLayout } from "./layouts/PublicLayout";
import { SubscriberLayout } from "./layouts/SubscriberLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/public/HomePage";
import { CharitiesPage } from "./pages/public/CharitiesPage";
import { CharityProfilePage } from "./pages/public/CharityProfilePage";
import { DrawMechanicsPage } from "./pages/public/DrawMechanicsPage";
import { SubscribePage } from "./pages/public/SubscribePage";
import { SubscribeSuccessPage } from "./pages/public/SubscribeSuccessPage";
import { SubscribeCancelledPage } from "./pages/public/SubscribeCancelledPage";
import { LoginPage } from "./pages/public/LoginPage";
import { SignupPage } from "./pages/public/SignupPage";
import { AuthSignupPage } from "./pages/auth/AuthSignupPage";
import { SignupConfirmPage } from "./pages/auth/SignupConfirmPage";
import { AuthLoginPage } from "./pages/auth/AuthLoginPage";
import { AuthForgotPasswordPage } from "./pages/auth/AuthForgotPasswordPage";
import { AuthUpdatePasswordPage } from "./pages/auth/AuthUpdatePasswordPage";
import { AuthCallbackPage } from "./pages/auth/AuthCallbackPage";
import { SubscriberHomePage } from "./pages/subscriber/SubscriberHomePage";
import { SubscriberSubscriptionPage } from "./pages/subscriber/SubscriberSubscriptionPage";
import { SubscriberScoresPage } from "./pages/subscriber/SubscriberScoresPage";
import { SubscriberCharityPage } from "./pages/subscriber/SubscriberCharityPage";
import { SubscriberParticipationPage } from "./pages/subscriber/SubscriberParticipationPage";
import { SubscriberWinningsPage } from "./pages/subscriber/SubscriberWinningsPage";
import { SubscriberProofUploadPage } from "./pages/subscriber/SubscriberProofUploadPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminDrawsPage } from "./pages/admin/AdminDrawsPage";
import { AdminCharitiesPage } from "./pages/admin/AdminCharitiesPage";
import { AdminWinnersPage } from "./pages/admin/AdminWinnersPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AccessRestrictedPage } from "./pages/shared/AccessRestrictedPage";
import { NotFoundPage } from "./pages/shared/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTE_PATHS.public.home} element={<HomePage />} />
        <Route path={ROUTE_PATHS.public.charities} element={<CharitiesPage />} />
        <Route path={ROUTE_PATHS.public.charityProfile} element={<CharityProfilePage />} />
        <Route path={ROUTE_PATHS.public.drawMechanics} element={<DrawMechanicsPage />} />
        <Route path={ROUTE_PATHS.public.subscribe} element={<SubscribePage />} />
        <Route path={ROUTE_PATHS.public.subscribeSuccess} element={<SubscribeSuccessPage />} />
        <Route path={ROUTE_PATHS.public.subscribeCancelled} element={<SubscribeCancelledPage />} />
        <Route path={ROUTE_PATHS.public.login} element={<LoginPage />} />
        <Route path={ROUTE_PATHS.public.signup} element={<SignupPage />} />
        <Route path={ROUTE_PATHS.auth.signup} element={<AuthSignupPage />} />
        <Route path={ROUTE_PATHS.auth.signupConfirm} element={<SignupConfirmPage />} />
        <Route path={ROUTE_PATHS.auth.login} element={<AuthLoginPage />} />
        <Route path={ROUTE_PATHS.auth.forgotPassword} element={<AuthForgotPasswordPage />} />
        <Route path={ROUTE_PATHS.auth.updatePassword} element={<AuthUpdatePasswordPage />} />
        <Route path={ROUTE_PATHS.auth.callback} element={<AuthCallbackPage />} />
        <Route path={ROUTE_PATHS.shared.accessRestricted} element={<AccessRestrictedPage />} />
      </Route>

      <Route
        path={ROUTE_PATHS.subscriber.base}
        element={
          <ProtectedRoute>
            <RoleBoundary allow={[USER_ROLES.subscriber]}>
              <SubscriberLayout />
            </RoleBoundary>
          </ProtectedRoute>
        }
      >
        {/* Subscription management is accessible even after cancellation */}
        <Route path={ROUTE_PATHS.subscriber.subscription} element={<SubscriberSubscriptionPage />} />

        {/* All other dashboard routes require active subscription */}
        <Route
          index
          element={
            <SubscriptionBoundary>
              <SubscriberHomePage />
            </SubscriptionBoundary>
          }
        />
        <Route path={ROUTE_PATHS.subscriber.scores} element={<SubscriptionBoundary><SubscriberScoresPage /></SubscriptionBoundary>} />
        <Route path={ROUTE_PATHS.subscriber.charity} element={<SubscriptionBoundary><SubscriberCharityPage /></SubscriptionBoundary>} />
        <Route path={ROUTE_PATHS.subscriber.participation} element={<SubscriptionBoundary><SubscriberParticipationPage /></SubscriptionBoundary>} />
        <Route path={ROUTE_PATHS.subscriber.winnings} element={<SubscriptionBoundary><SubscriberWinningsPage /></SubscriptionBoundary>} />
        <Route path={ROUTE_PATHS.subscriber.proofUpload} element={<SubscriptionBoundary><SubscriberProofUploadPage /></SubscriptionBoundary>} />
      </Route>

      <Route
        path={ROUTE_PATHS.admin.base}
        element={
          <ProtectedRoute>
            <RoleBoundary allow={[USER_ROLES.admin]}>
              <AdminLayout />
            </RoleBoundary>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTE_PATHS.admin.home} replace />} />
        <Route path={ROUTE_PATHS.admin.users} element={<AdminUsersPage />} />
        <Route path={ROUTE_PATHS.admin.draws} element={<AdminDrawsPage />} />
        <Route path={ROUTE_PATHS.admin.charities} element={<AdminCharitiesPage />} />
        <Route path={ROUTE_PATHS.admin.winners} element={<AdminWinnersPage />} />
        <Route path={ROUTE_PATHS.admin.reports} element={<AdminReportsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;