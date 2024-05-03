import { Hanken_Grotesk, Noto_Serif } from "next/font/google";

export const hkGrotesk = Hanken_Grotesk({
    weight: ["400","500", '600', "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    display: "swap",
    variable: '--font-hk-grotesk',
  });


  export const notoSerif = Noto_Serif({
    weight: ["400", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    display: "swap",
    variable: '--font-noto-serif',
  });