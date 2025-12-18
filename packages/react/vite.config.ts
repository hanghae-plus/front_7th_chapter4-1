import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

const base: string = process.env.NODE_ENV === "production" ? "/front_6th_chapter4-1/react/" : "";

export default createViteConfig({
  base,
  plugins: [react()],
});
