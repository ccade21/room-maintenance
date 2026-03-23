"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/storage";
import { MaintenanceRequest, MaintenanceStatus, Profile } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import RoomSearch from "@/components/RoomSearch";

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"전체" | MaintenanceStatus>("전체");
  const [completeFiles, setCompleteFiles] = useState<Record<string, File | null>>({});

  const isAdmin = profile?.role === "admin";

  const load = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSessionUserId(session?.user?.id ?? null);

    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    setProfile(profileData ?? null);

    const { data, error } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      alert(`관리자 조회 실패: ${error.message}`);
    } else {
      setRequests((data || []) as MaintenanceRequest[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((item) => {
      const matchStatus = statusFilter === "전체" || item.status === statusFilter;
      const matchKeyword =
        !keyword ||
        item.room_no.toLowerCase().includes(keyword) ||
        item.team.toLowerCase().includes(keyword) ||
        item.issue.toLowerCase().includes(keyword) ||
        item.requester_name.toLowerCase().includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [requests, search, statusFilter]);

  const handleStatusChange = async (
    id: string,
    nextStatus: MaintenanceStatus
  ) => {
    if (!isAdmin) {
      alert("관리자만 가능해요");
      return;
    }

    try {
      let completeImageUrl: string | undefined;

      const selectedFile = completeFiles[id];

      if (nextStatus === "완료" && selectedFile && sessionUserId) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          alert("완료 사진은 5MB 이하만 가능해요");
          return;
        }

        completeImageUrl = await uploadImage(selectedFile, "complete", sessionUserId);
      }

      const payload: {
        status: MaintenanceStatus;
        complete_image_url?: string;
      } = {
        status: nextStatus,
      };

      if (completeImageUrl) {
        payload.complete_image_url = completeImageUrl;
      }

      const { error } = await supabase
        .from("maintenance_requests")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      alert("상태 변경 완료됐어요");
      await load();
    } catch (error) {
      alert(
        error instanceof Error ? `상태 변경 실패: ${error.message}` : "상태 변경 실패"
      );
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!isAdmin) {
      alert("관리자만 가능해요");
      return;
    }

    const ok = confirm("이 항목을 삭제 처리할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("maintenance_requests")
      .update({ is_deleted: true })
      .eq("id", id);

    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    alert("삭제 처리됐어요");
    await load();
  };

  const handleExportExcel = () => {
    if (!isAdmin) {
      alert("관리자만 반출 가능해요");
      return;
    }

    const rows = filtered.map((item) => ({
      접수시간: new Date(item.created_at).toLocaleString("ko-KR"),
      수정시간: new Date(item.updated_at).toLocaleString("ko-KR"),
      팀: item.team,
      룸번호: item.room_no,
      문제내용: item.issue,
      상태: item.status,
      접수자: item.requester_name,
      고장사진: item.issue_image_url || "",
      완료사진: item.complete_image_url || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "현황리스트");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-status-${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="card">불러오는 중...</div>;
  }

  if (!sessionUserId) {
    return <div className="card">관리자 페이지는 로그인 후 접근 가능해요</div>;
  }

  if (!isAdmin) {
    return <div className="card">관리자 권한이 없어요</div>;
  }

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>관리자 페이지</h1>
          <p className="muted">상태 변경, 삭제, 엑셀 반출을 관리해요</p>
        </div>

        <button className="button" onClick={handleExportExcel}>
          엑셀 반출
        </button>
      </div>

      <div className="card filter-row">
        <RoomSearch
          value={search}
          onChange={setSearch}
          placeholder="룸번호, 팀, 문제내용, 접수자 검색"
        />

        <select
          className="select"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "전체" | MaintenanceStatus)
          }
        >
          <option value="전체">전체</option>
          <option value="접수">접수</option>
          <option value="진행중">진행중</option>
          <option value="완료">완료</option>
        </select>
      </div>

      <div className="admin-list">
        {filtered.map((item) => (
          <div className="card admin-item" key={item.id}>
            <div className="admin-head">
              <div>
                <h3>
                  {item.room_no} / {item.team}
                </h3>
                <p className="muted small">
                  {new Date(item.created_at).toLocaleString("ko-KR")} · 접수자{" "}
                  {item.requester_name}
                </p>
              </div>

              <StatusBadge status={item.status} />
            </div>

            <p className="history-issue">{item.issue}</p>

            <div className="history-images">
              {item.issue_image_url && (
                <div>
                  <p className="muted small">고장 사진</p>
                  <a href={item.issue_image_url} target="_blank">
                    <img
                      src={item.issue_image_url}
                      alt="고장 사진"
                      className="history-image"
                    />
                  </a>
                </div>
              )}

              {item.complete_image_url && (
                <div>
                  <p className="muted small">완료 사진</p>
                  <a href={item.complete_image_url} target="_blank">
                    <img
                      src={item.complete_image_url}
                      alt="완료 사진"
                      className="history-image"
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="admin-actions">
              <select
                className="select"
                value={item.status}
                onChange={(e) =>
                  handleStatusChange(item.id, e.target.value as MaintenanceStatus)
                }
              >
                <option value="접수">접수</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
              </select>

              <input
                className="input"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) =>
                  setCompleteFiles((prev) => ({
                    ...prev,
                    [item.id]: e.target.files?.[0] || null,
                  }))
                }
              />

              <button
                className="button button-danger"
                onClick={() => handleSoftDelete(item.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && <div className="card">조회 결과가 없어요</div>}
      </div>
    </section>
  );
}