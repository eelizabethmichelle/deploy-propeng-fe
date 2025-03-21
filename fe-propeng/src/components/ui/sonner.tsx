"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center" 
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "font-bold text-lg group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Use specific HSL values for success and destructive for error/warning
          success: "!bg-[hsl(152,85%,36%)] !text-white !border-0 !rounded-md [&_.sonner-description]:!text-white [&_.sonner-description]:opacity-90",
          error: "!bg-[hsl(var(--destructive))] !text-[hsl(var(--destructive-foreground))] !border-0 !rounded-md [&_.sonner-description]:!text-[hsl(var(--destructive-foreground))] [&_.sonner-description]:opacity-90",
          warning: "!bg-[hsl(var(--destructive))] !text-[hsl(var(--destructive-foreground))] !border-0 !rounded-md [&_.sonner-description]:!text-[hsl(var(--destructive-foreground))] [&_.sonner-description]:opacity-90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
