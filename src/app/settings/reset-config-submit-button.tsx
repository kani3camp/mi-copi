"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "../ui/primitives";

export function ResetConfigSubmitButton(props: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      className="ui-header-link"
      disabled={pending}
      pending={pending}
    >
      {pending ? "リセット中..." : props.children}
    </Button>
  );
}
