"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RoomSearch from "@/components/RoomSearch";
import { supabase } from "@/lib/supabase";
import { Room } from "@/lib/types";

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_no", { ascending: true });

      if (error) {
        alert(`룸 목록 조회 실패: ${error.message}`);
      } else {
        setRooms(data || []);
      }
      setLoading(false);
    };

    loadRooms();
  }, []);

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rooms;

    return rooms.filter(
      (room) =>
        room.room_no.toLowerCase().includes(keyword) ||
        room.name.toLowerCase().includes(keyword) ||
        room.team.toLowerCase().includes(keyword)
    );
  }, [rooms, search]);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>룸 목록</h1>
          <p className="muted">룸 번호를 클릭하면 상세 페이지로 이동해요</p>
        </div>
      </div>

      <div className="card">
        <RoomSearch value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <div className="card">불러오는 중...</div>
      ) : (
        <div className="room-grid">
          {filteredRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${encodeURIComponent(room.room_no)}`}
              className="room-card"
            >
              <div className="room-card-top">
                <strong>{room.room_no}</strong>
                <span className="room-clean">{room.clean_class || "-"}</span>
              </div>
              <div className="room-card-name">{room.name}</div>
              <div className="room-card-team">{room.team}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}