import * as React from "react";
import { cn } from "@/lib/utils";

// Select nativo (não o Radix/Base UI Select) estilizado para combinar com
// Input — usado nos formulários porque um <select> nativo aparece em
// FormData automaticamente, o que o Select do shadcn não faz sem plumbing
// extra. Mesmo motivo em toda a área de matrícula/aprovação.
function SelectNative({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

export { SelectNative };
