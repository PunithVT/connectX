import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button, Card } from "@/components/ui";
import { ProfileCard } from "./ProfileCard";
import { ConnectButton } from "@/features/network/ConnectButton";
import { EndorsementsCard } from "@/features/endorsements/EndorsementsCard";
import { fetchMyProfile, fetchProfile } from "@/api/profile.api";

export function ProfilePage() {
  const { userId } = useParams();
  const isOwn = !userId;

  const profile = useQuery({
    queryKey: isOwn ? ["profile", "me"] : ["profile", userId],
    queryFn: () => (isOwn ? fetchMyProfile() : fetchProfile(Number(userId))),
    retry: false,
  });

  if (profile.isLoading) return <div className="cx-spinner" />;

  // Own profile may not exist yet (e.g. admin) — guide them to create it.
  if (isOwn && (profile.isError || !profile.data)) {
    return (
      <div className="stack gap-6">
        <h1 className="page-title">My profile</h1>
        <Card surface="brutalist">
          <h3>Let's set up your profile</h3>
          <p className="muted">
            You don't have an alumni profile yet. Add where you work and your expertise
            so the right people can find you.
          </p>
          <Link to="/profile/edit">
            <Button className="mt-4">Complete my profile</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (profile.isError || !profile.data)
    return <p className="muted">Profile not found.</p>;

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">{isOwn ? "My profile" : "Profile"}</h1>
        {isOwn ? (
          <Link to="/profile/edit">
            <Button variant="secondary">Edit profile</Button>
          </Link>
        ) : (
          <ConnectButton userId={Number(userId)} />
        )}
      </div>
      <ProfileCard profile={profile.data} />
      <EndorsementsCard
        userId={profile.data.user_id}
        isOwn={isOwn}
      />
    </div>
  );
}
