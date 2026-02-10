import { NextResponse } from "next/server";

export async function POST() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch(
    "https://api.github.com/repos/Mohamed3on/formtracker/actions/workflows/refresh-data.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("GitHub dispatch failed:", res.status, text);
    return NextResponse.json({ error: "Failed to trigger workflow" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
