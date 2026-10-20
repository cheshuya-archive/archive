"use client";
import { useEffect } from "react";
import { mountBackToTop } from "@/lib/back-to-top";

export function BackToTop() {
  useEffect(() => mountBackToTop(), []);
  return null;
}
