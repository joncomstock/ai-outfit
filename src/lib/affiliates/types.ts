export interface AffiliateProduct {
  externalId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  description?: string;
  colors?: string[];
  sizes?: string[];
}

export interface AffiliateProvider {
  name: string;
  searchProducts(
    query: string,
    category?: string,
    limit?: number,
  ): Promise<AffiliateProduct[]>;
  getProduct(externalId: string): Promise<AffiliateProduct | null>;
}
