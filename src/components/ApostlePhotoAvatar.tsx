"use client";

import { useState } from "react";
import Image from "next/image";
import { ApostleAvatar } from "@/components/ApostleAvatar";
import { APOSTLES, type ApostleId } from "@/lib/apostles";

type ApostlePhotoAvatarProps = {
  apostleId: ApostleId;
  size?: "sm" | "md";
};

const SIZE_PX: Record<NonNullable<ApostlePhotoAvatarProps["size"]>, number> = {
  sm: 32,
  md: 40,
};

const SIZE_CLASSES: Record<NonNullable<ApostlePhotoAvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

/** A round chat-contact-photo avatar for an apostle (public/apostles/{id}.png)
 * — for a back-and-forth conversation like Peter's Watch, where the same
 * recognizable face needs to sit next to every message from that apostle,
 * not just a badge icon. Falls back to the existing icon badge (ApostleAvatar)
 * if the portrait fails to load, same graceful-degrade pattern as
 * CompanionPortrait on the landing page. */
export function ApostlePhotoAvatar({ apostleId, size = "sm" }: ApostlePhotoAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) return <ApostleAvatar apostleId={apostleId} size={size} />;

  return (
    <Image
      src={`/apostles/${apostleId}.png`}
      alt={APOSTLES[apostleId].name}
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      className={`shrink-0 rounded-full object-cover object-top ${SIZE_CLASSES[size]}`}
      onError={() => setImgError(true)}
    />
  );
}
