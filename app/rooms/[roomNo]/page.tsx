"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/storage";
import { MaintenanceRequest, Profile, Room } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function RoomDetailPage() {
  const params = useParams();
  const roomNo = decodeURIComponent(params.roomNo as string);

  const [room, setRoom] = useState<Room | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  const [issue, setIssue] = useState("");
  const [issueImage, setIssueImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const latestStatus = useMemo(() => {
    if (!requests.length) return null;
    return requests[0].status;
  }, [requests]);

  const loadAll = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSessionUserId(session?.user?.id ?? null);

    if (session?.user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      setProfile(profileData ?? null);
    } else {
      setProfile(null);
    }

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_no", roomNo)
      .maybeSingle();

    if (roomError) {
      alert(`룸 조회 실패: ${roomError.message}`);
    } else {
      setRoom(roomData ?? null);
    }

    const { data: requestData, error: requestError } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("room_no", roomNo)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (requestError) {
      alert(`이력 조회 실패: ${requestError.message}`);
    } else {
      setRequests((requestData || []) as MaintenanceRequest[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [roomNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionUserId) {
      alert("로그인 후 접수 가능해요");
      return;
    }

    if (!room) {
      alert("룸 정보가 없어요");
      return;
    }

    if (!issue.trim()) {
      alert("문제 내용을 입력해줘요");
      return;
    }

    if (issueImage && issueImage.size > 5 * 1024 * 1024) {
      alert("사진은 5MB 이하만 가능해요");
      return;
    }

    setSubmitting(true);

    try {
      let issueImageUrl: string | null = null;

      if (issueImage) {
        issueImageUrl = await uploadImage(issueImage, "issue", sessionUserId);
      }

      const requesterName = profile?.name
         ? profile.name
         : profile?.email
         ? profile.email.split("@")[0]
         : "로그인 사용자";

      const { error } = await supabase.from("maintenance_requests").insert({
        team: room.team,
        room_no: room.room_no,
        status: "접수",
        issue: issue.trim(),
        issue_image_url: issueImageUrl,
        requester_name: requesterName,
        requester_user_id: sessionUserId,
      });

      if (error) {
        throw new Error(error.message);
      }

      setIssue("");
      setIssueImage(null);
      alert("접수 완료됐어요");
      await loadAll();
    } catch (error) {
      alert(
        error instanceof Error ? `접수 실패: ${error.message}` : "접수 실패"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card">불러오는 중...</div>;
  }

  if (!room) {
    return <div className="card">해당 룸을 찾지 못했어요</div>;
  }

  return (
    <section className="page-stack">
      <div className="card">
        <h1>{room.room_no}</h1>
        <p className="muted">{room.name}</p>
        <div className="detail-meta">
          <span>팀: {room.team}</span>
          <span>청정도: {room.clean_class || "-"}</span>
          <span>
            현재 상태: {latestStatus ? <StatusBadge status={latestStatus} /> : "접수 이력 없음"}
          </span>
        </div>
      </div>

      <div className="card">
        <h2>고장 접수</h2>
        {sessionUserId ? (
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="label">문제 내용</label>
            <textarea
              className="textarea"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="고장 내용을 입력해줘요"
              rows={5}
              required
            />

            <label className="label">고장 사진 (선택, 1장)</label>
            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setIssueImage(e.target.files?.[0] || null)}
            />

            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "접수 중..." : "접수 등록"}
            </button>
          </form>
        ) : (
          <p className="muted">로그인 후 접수 가능해요. 비로그인 사용자는 조회만 가능해요.</p>
        )}
      </div>

      <div className="card">
        <h2>접수 이력</h2>
        {requests.length === 0 ? (
          <p className="muted">등록된 이력이 아직 없어요</p>
        ) : (
          <div className="history-list">
            {requests.map((req) => (
              <div key={req.id} className="history-item">
                <div className="history-head">
                  <StatusBadge status={req.status} />
                  <span className="muted">
                    {new Date(req.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>

                <p className="history-issue">{req.issue}</p>

                <div className="history-meta">
                  <span>접수자: {req.requester_name}</span>
                </div>

                <div className="history-images">
                  {req.issue_image_url && (
                    <div>
                      <p className="muted small">고장 사진</p>
                      <a href={req.issue_image_url} target="_blank">
                        <img
                          src={req.issue_image_url}
                          alt="고장 사진"
                          className="history-image"
                        />
                      </a>
                    </div>
                  )}

                  {req.complete_image_url && (
                    <div>
                      <p className="muted small">완료 사진</p>
                      <a href={req.complete_image_url} target="_blank">
                        <img
                          src={req.complete_image_url}
                          alt="완료 사진"
                          className="history-image"
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}