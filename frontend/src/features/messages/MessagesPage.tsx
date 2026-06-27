import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, Button, Card } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { timeAgo } from "@/lib/format";
import {
  getThread,
  listConversations,
  sendMessage,
} from "@/api/messages.api";
import { fetchProfile } from "@/api/profile.api";
import type { Conversation } from "@/types/models";

function ConversationList({
  conversations,
  activeId,
}: {
  conversations: Conversation[];
  activeId?: number;
}) {
  if (!conversations.length)
    return (
      <p className="muted" style={{ padding: "0 4px" }}>
        No conversations yet. Connect with alumni in the{" "}
        <Link to="/directory" style={{ color: "var(--rooman-blue)" }}>
          directory
        </Link>{" "}
        to start chatting.
      </p>
    );

  return (
    <div className="stack gap-2">
      {conversations.map((c) => {
        const active = c.peer.id === activeId;
        return (
          <Link
            key={c.peer.id}
            to={`/messages/${c.peer.id}`}
            className="row gap-3"
            style={{
              alignItems: "center",
              padding: "10px 12px",
              border: "2px solid var(--rooman-ink)",
              background: active ? "var(--rooman-accent)" : "var(--surface-raised)",
            }}
          >
            <Avatar name={c.peer.full_name} size={40} />
            <div className="stack" style={{ minWidth: 0, flex: 1 }}>
              <div className="row between">
                <strong
                  style={{ fontFamily: "var(--font-display)", fontSize: 14 }}
                >
                  {c.peer.full_name}
                </strong>
                <span className="small muted">{timeAgo(c.last_at)}</span>
              </div>
              <span
                className="small muted"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.last_message}
              </span>
            </div>
            {c.unread > 0 && (
              <span
                className="center"
                style={{
                  background: "var(--rooman-primary)",
                  color: "#fff",
                  borderRadius: "50%",
                  minWidth: 20,
                  height: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "0 5px",
                }}
              >
                {c.unread}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function ThreadView({ peerId }: { peerId: number }) {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const peer = useQuery({
    queryKey: ["profile", String(peerId)],
    queryFn: () => fetchProfile(peerId),
    retry: false,
  });

  const thread = useQuery({
    queryKey: ["thread", peerId],
    queryFn: () => getThread(peerId),
    refetchInterval: 15_000,
  });

  const send = useMutation({
    mutationFn: (body: string) => sendMessage(peerId, body),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["thread", peerId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Mark conversation read whenever we open/refresh a thread.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["messages", "unread"] });
  }, [peerId, thread.data, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data]);

  const peerName = peer.data?.user?.full_name ?? "Alumnus";

  const submit = () => {
    const body = draft.trim();
    if (body) send.mutate(body);
  };

  return (
    <Card surface="brutalist" style={{ display: "flex", flexDirection: "column", height: "70vh" }}>
      <div
        className="row between"
        style={{
          paddingBottom: 12,
          borderBottom: "2px solid var(--rooman-ink)",
        }}
      >
        <Link
          to={`/profile/${peerId}`}
          className="row gap-2"
          style={{ alignItems: "center" }}
        >
          <Avatar name={peerName} size={40} />
          <div className="stack">
            <strong style={{ fontFamily: "var(--font-display)" }}>{peerName}</strong>
            <span className="small muted">
              {peer.data?.headline ?? peer.data?.current_company ?? "Rooman alumnus"}
            </span>
          </div>
        </Link>
      </div>

      <div
        className="stack gap-2"
        style={{ flex: 1, overflowY: "auto", padding: "14px 4px" }}
      >
        {thread.isLoading ? (
          <div className="cx-spinner" />
        ) : !thread.data?.length ? (
          <p className="muted center" style={{ marginTop: 24 }}>
            Say hello to {peerName} 💬
          </p>
        ) : (
          thread.data.map((m) => {
            const mine = m.sender_id === me?.id;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    border: "2px solid var(--rooman-ink)",
                    background: mine
                      ? "var(--rooman-primary)"
                      : "var(--surface-raised)",
                    color: mine ? "#fff" : "var(--rooman-ink)",
                    boxShadow: "3px 3px 0 var(--rooman-ink)",
                  }}
                >
                  {m.body}
                </div>
                <span
                  className="small muted"
                  style={{
                    display: "block",
                    textAlign: mine ? "right" : "left",
                    marginTop: 2,
                  }}
                >
                  {timeAgo(m.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div
        className="row gap-2"
        style={{ paddingTop: 12, borderTop: "2px solid var(--rooman-ink)" }}
      >
        <input
          className="neu-input"
          style={{ flex: 1 }}
          placeholder={`Message ${peerName}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button onClick={submit} disabled={send.isPending || !draft.trim()}>
          Send
        </Button>
      </div>
    </Card>
  );
}

export function MessagesPage() {
  const { userId } = useParams();
  const peerId = userId ? Number(userId) : undefined;
  const isWide = useMediaQuery("(min-width: 880px)");

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: 30_000,
  });

  const list = (
    <Card surface="brutalist">
      <h3 style={{ marginTop: 0 }}>Messages</h3>
      {conversations.isLoading ? (
        <div className="cx-spinner" />
      ) : (
        <ConversationList
          conversations={conversations.data ?? []}
          activeId={peerId}
        />
      )}
    </Card>
  );

  // On narrow screens, show either the list or the open thread (not both).
  if (!isWide) {
    return (
      <div className="stack gap-4">
        <h1 className="page-title">Messages</h1>
        {peerId ? (
          <>
            <Link to="/messages" className="small" style={{ color: "var(--rooman-blue)" }}>
              ← All conversations
            </Link>
            <ThreadView peerId={peerId} />
          </>
        ) : (
          list
        )}
      </div>
    );
  }

  return (
    <div className="stack gap-4">
      <h1 className="page-title">Messages</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "var(--space-4)",
          alignItems: "start",
        }}
      >
        {list}
        {peerId ? (
          <ThreadView peerId={peerId} />
        ) : (
          <Card surface="brutalist" className="center" style={{ minHeight: 240 }}>
            <p className="muted">Select a conversation to start chatting.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
