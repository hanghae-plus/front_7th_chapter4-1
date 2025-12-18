import { useCallback } from "react"; // React의 원본 useCallback 사용
import { CartModal } from "../components";
import { useModalContext } from "../../../components";

export const useCartModal = () => {
  const { open } = useModalContext();

  // useAutoCallback 대신 useCallback 사용 (SSR 호환)
  return useCallback(() => {
    open(<CartModal />);
  }, [open]);
};
