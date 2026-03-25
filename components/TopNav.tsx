"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";

export default function TopNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        setEmail(session.user.email ?? null);

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (mounted) {
          setProfile(data ?? null);
        }
      } else {
        setEmail(null);
        setProfile(null);
      }
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    location.href = "/";
  };

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <div className="topnav-left">
          <Link href="/" className="brand">
            Room Data Sheet
          </Link>

          <nav className="nav-links">
            <Link href="/">룸 목록</Link>
            <Link href="/status">고장 리스트</Link>
            {profile?.role === "admin" && <Link href="/admin">관리자 페이지</Link>}
          </nav>
        </div>

        <div className="topnav-right">
          {email ? (
            <>
              <span className="user-text">
                {profile?.name || email}
                {profile?.role === "admin" ? " (관리자)" : ""}
              </span>
              <button className="button button-outline" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login" className="button">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}