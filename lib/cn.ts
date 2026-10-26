import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * 登记 preset 里的自定义刻度名。否则 tailwind-merge 会把 text-h2 当成文字颜色，
 * 和 text-text-secondary 合并时丢掉其中一个。
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["h1", "h2", "h3", "h4", "h5"],
      shadow: ["secondary", "tertiary", "card"],
      "font-weight": ["strong"],
    },
    classGroups: {
      duration: [{ duration: ["fast", "mid", "slow"] }],
    },
  },
});

/** 合并 className，后写的 Tailwind 类覆盖先写的同类。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
