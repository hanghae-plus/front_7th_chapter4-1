import { addEvent, isNearBottom, registerGlobalEvents } from "./utils";
import { UI_ACTIONS } from "./stores";
import { useCartService, useProductService, useRouterService } from "./services";
import { StoreContext } from "./contexts";

function useProductEvents() {
  const { searchProducts, setLimit, setSort, setCategory } = useRouterService();
  const { loadProducts } = useProductService();

  addEvent("keydown", "#search-input", (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      try {
        searchProducts(query);
      } catch (error) {
        console.error("검색 실패:", error);
      }
    }
  });

  addEvent("change", "#limit-select", (e) => {
    const limit = parseInt(e.target.value);
    try {
      setLimit(limit);
    } catch (error) {
      console.error("상품 수 변경 실패:", error);
    }
  });

  addEvent("change", "#sort-select", (e) => {
    const sort = e.target.value;

    try {
      setSort(sort);
    } catch (error) {
      console.error("정렬 변경 실패:", error);
    }
  });

  addEvent("click", "#clear-search", () => {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
    }

    try {
      searchProducts("");
    } catch (error) {
      console.error("검색 초기화 실패:", error);
    }
  });

  addEvent("click", "[data-breadcrumb]", (e) => {
    const breadcrumbType = e.target.getAttribute("data-breadcrumb");

    try {
      if (breadcrumbType === "reset") {
        // "전체" 클릭 -> 카테고리 초기화
        setCategory({ category1: "", category2: "" });
      } else if (breadcrumbType === "category1") {
        // 1depth 클릭 -> 2depth 제거하고 1depth만 유지
        const category1 = e.target.getAttribute("data-category1");
        setCategory({ category1, category2: "" });
      }
    } catch (error) {
      console.error("브레드크럼 네비게이션 실패:", error);
    }
  });

  addEvent("click", ".category1-filter-btn", (e) => {
    const category1 = e.target.getAttribute("data-category1");
    if (!category1) return;

    try {
      setCategory({ category1, category2: "" });
    } catch (error) {
      console.error("1depth 카테고리 선택 실패:", error);
    }
  });

  addEvent("click", ".category2-filter-btn", async (e) => {
    const category1 = e.target.getAttribute("data-category1");
    const category2 = e.target.getAttribute("data-category2");
    if (!category1 || !category2) return;

    try {
      setCategory({ category1, category2 });
    } catch (error) {
      console.error("2depth 카테고리 선택 실패:", error);
    }
  });

  addEvent("click", "#retry-btn", async () => {
    try {
      await loadProducts(true);
    } catch (error) {
      console.error("재시도 실패:", error);
    }
  });
}

function useProductDetailEvents() {
  const { router } = useRouterService();
  const productService = useProductService();
  const cartService = useCartService();

  addEvent("click", ".product-image, .product-info", async (e) => {
    const productCard = e.target.closest(".product-card");
    if (!productCard) return;

    const productId = productCard.getAttribute("data-product-id");
    if (!productId) return;

    // 상품 상세 페이지로 이동
    router.push(`/product/${productId}/`);
  });

  addEvent("click", ".related-product-card", async (e) => {
    const productId = e.target.closest("[data-product-id]").dataset.productId;
    if (!productId) return;

    // 상품 상세 페이지로 이동
    router.push(`/product/${productId}/`);
  });

  addEvent("click", ".breadcrumb-link", async (e) => {
    e.preventDefault();

    try {
      // 카테고리 설정
      const categories = {};
      const elements = [...e.target.parentNode.querySelectorAll(".breadcrumb-link")].slice(0, 2);
      for (const [index, element] of Object.entries(elements)) {
        const key = `category${parseInt(index) + 1}`;
        categories[key] = element.dataset[key];
        if (element === e.target) {
          break;
        }
      }
      const queryString = new URLSearchParams(categories).toString();
      router.push(`/?${queryString}`);
    } catch (error) {
      console.error("브레드크럼 카테고리 필터 실패:", error);
    }
  });

  addEvent("click", ".go-to-product-list", () => {
    const product = productService.currentProduct;
    const query = { category1: product?.category1, category2: product?.category2 };
    const queryString = new URLSearchParams(query).toString();
    router.push(`/?${queryString}`);
  });

  addEvent("click", "#quantity-increase", () => {
    const input = document.getElementById("quantity-input");
    if (input) {
      const max = parseInt(input.getAttribute("max")) || 100;
      input.value = Math.min(max, parseInt(input.value) + 1);
    }
  });

  addEvent("click", "#quantity-decrease", () => {
    const input = document.getElementById("quantity-input");
    if (input) {
      input.value = Math.max(1, parseInt(input.value) - 1);
    }
  });

  addEvent("click", "#add-to-cart-btn", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    const quantityInput = document.getElementById("quantity-input");
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (!productId) return;

    const product = productService.currentProduct;
    if (product) {
      cartService.addToCart(product, quantity);
    }
  });
}

function useCartEvents() {
  const productService = useProductService();
  const cartService = useCartService();

  addEvent("click", ".add-to-cart-btn", async (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (!productId) return;

    const product = productService.findProduct(productId);
    if (product) {
      cartService.addToCart(product, 1);
    }
  });

  addEvent("click", ".quantity-increase-btn", (e) => {
    const target = e.target.closest("[data-product-id]");
    const productId = target.getAttribute("data-product-id");
    const quantityInput = target.previousElementSibling;

    if (productId && quantityInput) {
      const newQuantity = parseInt(quantityInput.value) + 1;
      quantityInput.value = newQuantity;
      cartService.updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("click", ".quantity-decrease-btn", (e) => {
    const target = e.target.closest("[data-product-id]");
    const productId = target.getAttribute("data-product-id");
    const quantityInput = target.nextElementSibling;

    if (productId && quantityInput) {
      const newQuantity = Math.max(1, parseInt(quantityInput.value) - 1);
      quantityInput.value = newQuantity;
      cartService.updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("change", ".quantity-input", (e) => {
    const productId = e.target.closest("[data-product-id]");
    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);

    if (productId) {
      cartService.updateCartQuantity(productId, newQuantity);
    }
  });

  addEvent("change", ".cart-item-checkbox", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (productId) {
      cartService.toggleCartSelect(productId);
    }
  });

  addEvent("change", "#select-all-checkbox", (e) => {
    if (e.target.checked) {
      cartService.selectAllCart();
    } else {
      cartService.deselectAllCart();
    }
  });

  addEvent("click", ".cart-item-remove-btn", (e) => {
    const productId = e.target.getAttribute("data-product-id");
    if (productId) {
      cartService.removeFromCart(productId);
    }
  });

  addEvent("click", "#remove-selected-btn", cartService.removeSelectedFromCart);

  addEvent("click", "#clear-cart-btn", cartService.clearCart);
}

function useCartModalEvents() {
  const { uiStore } = StoreContext.use();
  const cartService = useCartService();
  addEvent("click", "#cart-icon-btn", () => {
    uiStore.dispatch({ type: UI_ACTIONS.OPEN_CART_MODAL });
  });

  addEvent("click", "#cart-modal-close-btn, .cart-modal-overlay", () => {
    uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const cartModalState = uiStore.getState().cartModal;
      if (cartModalState.isOpen) {
        uiStore.dispatch({ type: UI_ACTIONS.CLOSE_CART_MODAL });
      }
    }
  });

  addEvent("change", "#cart-modal-select-all-checkbox", (e) => {
    if (e.target.checked) {
      cartService.selectAllCart();
    } else {
      cartService.deselectAllCart();
    }
  });

  addEvent("click", "#cart-modal-remove-selected-btn", () => {
    cartService.removeSelectedFromCart();
  });

  addEvent("click", "#cart-modal-clear-cart-btn", cartService.clearCart);

  addEvent("click", "#cart-modal-checkout-btn", () => {
    uiStore.dispatch({
      type: UI_ACTIONS.SHOW_TOAST,
      payload: {
        message: "구매 기능은 추후 구현 예정입니다.",
        type: "info",
      },
    });
  });
}

function useScrollEvents() {
  const { router } = useRouterService();
  const productService = useProductService();
  // 무한 스크롤 (직접 등록) - 홈 페이지에서만 동작
  window.addEventListener("scroll", async () => {
    if (router.route.path !== "/" || !isNearBottom(200) || !productService.loadable) {
      return;
    }

    try {
      await productService.loadMoreProducts();
    } catch (error) {
      console.error("무한 스크롤 로드 실패:", error);
    }
  });
}

function useToastEvents() {
  const { uiStore } = StoreContext.use();
  addEvent("click", "#toast-close-btn", () => {
    uiStore.dispatch({ type: UI_ACTIONS.HIDE_TOAST });
  });
}

function useLinkEvents() {
  const { router } = useRouterService();
  addEvent("click", "[data-link]", (e) => {
    e.preventDefault();
    const url = e.target.getAttribute("href");
    if (url) {
      router.push(url);
    }
  });
}

export function useAllEvents() {
  useProductEvents();
  useProductDetailEvents();
  useCartEvents();
  useCartModalEvents();
  useScrollEvents();
  useToastEvents();
  useLinkEvents();

  registerGlobalEvents();
}
