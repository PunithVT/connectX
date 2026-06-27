import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui";
import { ProfileCard } from "./ProfileCard";
import { fetchMyProfile, fetchProfile } from "@/api/profile.api";

export function ProfilePage() {
  const { userId } = useParams();
  const isOwn = !userId;

  const profile = useQuery({
    queryKey: isOwn ? ["profile", "me"] : ["profile", userId],
    queryFn: () => (isOwn ? fetchMyProfile() : fetchProfile(Number(userId))),
  });

  if (profile.isLoading) return <div className="cx-spinner" />;
  if (profile.isError || !profile.data)
    return <p className="muted">Profile not found.</p>;

  return (
    <div className="stack gap-6">
      <div className="row between wrap gap-2">
        <h1 className="page-title">{isOwn ? "My profile" : "Profile"}</h1>
        {isOwn && (
          <Link to="/profile/edit">
            <Button variant="secondary">Edit profile</Button>
          </Link>
        )}
      </div>
      <ProfileCard profile={profile.data} />
    </div>
  );
}
