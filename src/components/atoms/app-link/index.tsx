"use client";

import Link from "next/link";
import { useOffline } from "next/offline";
import type { ComponentProps } from "react";

type AppLinkProps = ComponentProps<typeof Link> & {
  "data-active"?: boolean;
};

export function AppLink(props: AppLinkProps) {
  const isOffline = useOffline();

  if (isOffline && typeof props.href === "string") {
    return (
      <a
        aria-current={props["aria-current"]}
        aria-label={props["aria-label"]}
        className={props.className}
        data-active={props["data-active"]}
        href={props.href}
      >
        {props.children}
      </a>
    );
  }

  return <Link {...props} />;
}
