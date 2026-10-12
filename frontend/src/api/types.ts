export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  parentCategoryId?: string | null;
  subCategories?: CategoryDto[];
};

export type ProductListItem = {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  price: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  averageRating: number;
  reviewCount: number;
  isBestSeller: boolean;
  status: string;
  imageUrl?: string | null;
};

export type ProductListResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: ProductListItem[];
  facets?: {
    brands: string[];
    fabrics: string[];
    sizes: string[];
    colors: string[];
  };
};

export type ProductReview = {
  id?: string;
  userId?: string;
  authorName: string;
  /** Public URL or /uploads/… — when missing, UI shows initials (or live profile photo for own review). */
  authorAvatarUrl?: string | null;
  rating: number;
  title: string;
  body: string;
  createdAtUtc: string;
  /** Helpful votes from Product API (`TotalHelpful`). */
  totalHelpful?: number;
  tags: string[];
  images: string[];
};

export type ProductDetail = {
  id: string;
  name: string;
  description: string;
  sku: string;
  brand: string;
  price: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  stockQuantity: number;
  status: string;
  averageRating: number;
  reviewCount: number;
  isBestSeller: boolean;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; isPrimary: boolean; isVideo: boolean; altText?: string }[];
  attributes: { name: string; value: string }[];
  aboutItems: { title: string; description: string }[];
  reviews?: ProductReview[];
  related?: ProductListItem[];
  saleRelated?: ProductListItem[];
};

export type CartResponse = {
  itemsCount: number;
  totalAmount: number;
  items: {
    id: string;
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    totalPrice: number;
    imageUrl?: string | null;
  }[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  login: string;
  roleId: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type OrderDto = {
  id: string;
  /** #A12 short display number, e.g. #AT456BB */
  orderNumber?: string | null;
  orderDateUtc: string;
  status: string;
  totalAmount: number;
  itemsCount: number;
  userId?: string;
  userName?: string;
  userEmail?: string | null;
  recipientName?: string | null;
  shippingAddress?: string | null;
  paymentType?: string | null;
  items?: {
    productId: string;
    productName: string;
    productDescription?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal?: number;
    imageUrl?: string | null;
  }[];
};

export type AdminOrdersResponse = {
  items: OrderDto[];
  totalOrders: number;
  totalAmount: number;
  statusCounts: Record<string, number>;
  totalOrderCompare?: number | null;
  totalAmountCompare?: number | null;
  period?: { fromUtc: string; toUtc: string } | null;
  comparePeriod?: { fromUtc: string; toUtc: string } | null;
};

export type WishlistItemDto = {
  id: string;
  productId: string;
  createdAtUtc: string;
  product: ProductListItem;
};
