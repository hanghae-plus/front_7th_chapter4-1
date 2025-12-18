import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

const base: string = process.env.NODE_ENV === "production" ? "/front_7th_chapter4-1/react/" : "";

export default createViteConfig({
  base,
  plugins: [react()],
  ssr: {
    // @hanghae-plus/lib만 번들에 포함하고, react와 react-dom은 externalize
    noExternal: ["@hanghae-plus/lib"],
  },
});
