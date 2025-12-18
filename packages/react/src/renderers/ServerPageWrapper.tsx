import type { PropsWithChildren, ReactNode } from "react";

interface Props {
  headerLeft: ReactNode;
  cartCount?: number;
}

/**
 * SSR 전용 PageWrapper
 * 클라이언트 hooks 없이 순수 렌더링만 수행
 */
export const ServerPageWrapper = ({ headerLeft, children, cartCount = 0 }: PropsWithChildren<Props>) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {headerLeft}
            <div className="flex items-center space-x-2">
              {/* 장바구니 아이콘 */}
              <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <img src="/cart-header-icon.svg" alt="장바구니" className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">{children}</main>

      <footer className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto py-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} 항해플러스 프론트엔드 쇼핑몰</p>
        </div>
      </footer>
    </div>
  );
};
