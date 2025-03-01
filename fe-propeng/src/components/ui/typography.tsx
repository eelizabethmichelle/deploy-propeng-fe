import { COLORS } from "@/components/ui/color";
import { JSX } from "react";

const typographyStyles: Record<string, string> = {
  h1: `text-[48px] font-bold text-[${COLORS.primary.base}]`,
  h2: `text-[30px] font-bold text-[${COLORS.primary.base}]`,
  h3: `text-[24px] font-bold text-[${COLORS.primary.base}]`,
  h4: `text-[20px] font-bold text-[${COLORS.primary.base}]`,
  p: `text-[16px] text-[${COLORS.neutral.darker}]`,
  blockquote: `text-[16px] italic text-[${COLORS.neutral.darker}] border-l-2 pl-6 mt-6`,
  ul: `text-[16px] text-[${COLORS.neutral.darker}] my-6 ml-6 list-disc [&>li]:mt-2`,
  table: `text-[16px] my-6 border-collapse w-full`,
  th: `border px-4 py-2 text-left font-bold text-[${COLORS.primary.darker}]`,
  td: `border px-4 py-2 text-left text-[${COLORS.neutral.darker}]`,
  code: `text-[14px] font-bold text-[${COLORS.primary.base}] bg-gray-100 px-1 py-0.5 rounded`,
  lead: `text-[20px] text-[${COLORS.neutral.darker}]`,
  large: `text-[18px] font-bold text-[${COLORS.primary.base}]`,
  small: `text-[14px] text-[${COLORS.neutral.darker}]`,
  subtitle: `text-[14px] text-[${COLORS.neutral.base}]`,
};

export type TypographyProps = {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
};

export function Typography({ as: Tag = "p", children }: TypographyProps) {
  return <Tag className={typographyStyles[Tag] ?? ""}>{children}</Tag>;
}
