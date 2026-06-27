import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { InviteAcceptPage } from "@/features/invites/InviteAcceptPage";
import { InviteAdminPage } from "@/features/invites/InviteAdminPage";
import { FeedPage } from "@/features/feed/FeedPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ProfileEditPage } from "@/features/profile/ProfileEditPage";
import { OpportunitiesPage } from "@/features/opportunities/OpportunitiesPage";
import { MentorshipHubPage } from "@/features/mentorship/MentorshipHubPage";
import { BecomeMentorPage } from "@/features/mentorship/BecomeMentorPage";
import { StartupVarsityPage } from "@/features/startupvarsity/StartupVarsityPage";
import { CommunityPage } from "@/features/community/CommunityPage";
import { CommunityDetailPage } from "@/features/community/CommunityDetailPage";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
import { DirectoryPage } from "@/features/directory/DirectoryPage";
import { NetworkPage } from "@/features/network/NetworkPage";
import { MessagesPage } from "@/features/messages/MessagesPage";
import { EventsPage } from "@/features/events/EventsPage";
import { SpotlightPage } from "@/features/spotlight/SpotlightPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InviteAcceptPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/directory" element={<DirectoryPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:userId" element={<MessagesPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/mentorship" element={<MentorshipHubPage />} />
        <Route path="/mentorship/become" element={<BecomeMentorPage />} />
        <Route path="/startupvarsity" element={<StartupVarsityPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:communityId" element={<CommunityDetailPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/spotlight" element={<SpotlightPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin/invites" element={<InviteAdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
