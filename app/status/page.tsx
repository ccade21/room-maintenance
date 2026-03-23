"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MaintenanceRequest, MaintenanceStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import RoomSearch from "@/components/RoomSearch";

export default function StatusPage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"전체" | MaintenanceStatus>("전체");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) {
        alert(`현황 조회 실패: ${error.message}`);
      } else {
        setRequests((data || []) as MaintenanceRequest[]);
      }

      setLoading(false);
    };

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
  }, [requests, statusFilter, search]);

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <h1>현황 리스트</h1>
          <p className="muted">전체 접수 이력을 상태별로 확인해요</p>
        </div>
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

      <div className="card">
        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>접수시간</th>
                  <th>팀</th>
                  <th>룸번호</th>
                  <th>문제내용</th>
                  <th>상태</th>
                  <th>접수자</th>
                  <th>이동</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString("ko-KR")}</td>
                    <td>{item.team}</td>
                    <td>{item.room_no}</td>
                    <td>{item.issue}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.requester_name}</td>
                    <td>
                      <Link href={`/rooms/${encodeURIComponent(item.room_no)}`}>
                        상세
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty-box">조회 결과가 없어요</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}