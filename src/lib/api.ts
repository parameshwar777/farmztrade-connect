import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["animal_categories"]["Row"];
export type Listing = Database["public"]["Tables"]["animal_listings"]["Row"];
export type ListingImage = Database["public"]["Tables"]["animal_images"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type FeedProduct = Database["public"]["Tables"]["feed_products"]["Row"];
export type FeedCategory = Database["public"]["Tables"]["feed_categories"]["Row"];
export type FeedOrder = Database["public"]["Tables"]["feed_orders"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type ListingStatus = Database["public"]["Enums"]["listing_status"];

export type ListingWithMeta = Listing & {
  animal_images: Pick<ListingImage, "url" | "sort_order">[];
  seller: Pick<Profile, "id" | "full_name" | "avatar_url" | "verification" | "rating" | "created_at" | "city" | "district" | "state" | "phone"> | null;
};

const LISTING_SELECT =
  "*, animal_images(url, sort_order), seller:profiles!animal_listings_seller_id_fkey(id, full_name, avatar_url, verification, rating, created_at, city, district, state, phone)";

/** profiles has no FK from listings, so join manually. */
async function attachSellers(rows: Listing[]): Promise<ListingWithMeta[]> {
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.seller_id))];
  const [{ data: sellers }, { data: images }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, verification, rating, created_at, city, district, state, phone")
      .in("id", ids),
    supabase.from("animal_images").select("listing_id, url, sort_order").in(
      "listing_id",
      rows.map((r) => r.id),
    ),
  ]);
  const sellerMap = new Map((sellers ?? []).map((s) => [s.id, s]));
  return rows.map((row) => ({
    ...row,
    seller: (sellerMap.get(row.seller_id) as ListingWithMeta["seller"]) ?? null,
    animal_images: (images ?? [])
      .filter((i) => i.listing_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ url, sort_order }) => ({ url, sort_order })),
  }));
}

export type ListingFilters = {
  q?: string;
  category?: string;
  breed?: string;
  state?: string;
  district?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  gender?: "Male" | "Female" | "Any";
  minWeight?: number;
  maxWeight?: number;
  verifiedOnly?: boolean;
  vaccinatedOnly?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  limit?: number;
};

export async function fetchListings(filters: ListingFilters = {}): Promise<ListingWithMeta[]> {
  let query = supabase.from("animal_listings").select("*").eq("status", "approved");

  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(
      `title.ilike.${term},breed.ilike.${term},city.ilike.${term},district.ilike.${term},state.ilike.${term},village.ilike.${term}`,
    );
  }
  if (filters.breed) query = query.ilike("breed", `%${filters.breed}%`);
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.district) query = query.ilike("district", `%${filters.district}%`);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.minPrice) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice) query = query.lte("price", filters.maxPrice);
  if (filters.minAge) query = query.gte("age_months", filters.minAge);
  if (filters.maxAge) query = query.lte("age_months", filters.maxAge);
  if (filters.minWeight) query = query.gte("weight_kg", filters.minWeight);
  if (filters.maxWeight) query = query.lte("weight_kg", filters.maxWeight);
  if (filters.gender && filters.gender !== "Any") query = query.eq("gender", filters.gender);
  if (filters.vaccinatedOnly) query = query.eq("vaccinated", true);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "popular":
      query = query.order("views", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(filters.limit ?? 40);
  if (error) throw error;
  const withMeta = await attachSellers(data ?? []);
  return filters.verifiedOnly ? withMeta.filter((l) => l.seller?.verification === "approved") : withMeta;
}

export async function fetchListing(id: string): Promise<ListingWithMeta | null> {
  const { data, error } = await supabase.from("animal_listings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [full] = await attachSellers([data]);
  return full ?? null;
}

export async function fetchMyListings(userId: string): Promise<ListingWithMeta[]> {
  const { data, error } = await supabase
    .from("animal_listings")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachSellers(data ?? []);
}

export async function fetchCategories(): Promise<(Category & { count: number })[]> {
  const [{ data: cats, error }, { data: listings }] = await Promise.all([
    supabase.from("animal_categories").select("*").order("sort_order"),
    supabase.from("animal_listings").select("category_slug").eq("status", "approved"),
  ]);
  if (error) throw error;
  return (cats ?? []).map((c) => ({
    ...c,
    count: (listings ?? []).filter((l) => l.category_slug === c.slug).length,
  }));
}

export async function fetchVerifiedSellers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("verification", "approved")
    .order("rating", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data ?? [];
}

export async function fetchFavorites(userId: string): Promise<ListingWithMeta[]> {
  const { data, error } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
  if (error) throw error;
  const ids = (data ?? []).map((f) => f.listing_id);
  if (!ids.length) return [];
  const { data: listings } = await supabase.from("animal_listings").select("*").in("id", ids);
  return attachSellers(listings ?? []);
}

export async function fetchInterested(userId: string): Promise<ListingWithMeta[]> {
  const { data, error } = await supabase.from("animal_cart").select("listing_id").eq("user_id", userId);
  if (error) throw error;
  const ids = (data ?? []).map((f) => f.listing_id);
  if (!ids.length) return [];
  const { data: listings } = await supabase.from("animal_listings").select("*").in("id", ids);
  return attachSellers(listings ?? []);
}

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
  return (data ?? []).map((f) => f.listing_id);
}

export async function toggleFavorite(userId: string, listingId: string, on: boolean) {
  if (on) {
    const { error } = await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
    if (error) throw error;
  }
}

export async function addInterested(userId: string, listingId: string) {
  const { error } = await supabase.from("animal_cart").insert({ user_id: userId, listing_id: listingId });
  if (error && error.code !== "23505") throw error;
}

export async function removeInterested(userId: string, listingId: string) {
  const { error } = await supabase.from("animal_cart").delete().eq("user_id", userId).eq("listing_id", listingId);
  if (error) throw error;
}

/* ---------- offers ---------- */

export async function createOffer(input: {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message?: string;
}) {
  const { data, error } = await supabase.from("offers").insert(input).select().single();
  if (error) throw error;
  await supabase.from("notifications").insert({
    user_id: input.seller_id,
    type: "offer_new",
    title: "New offer received",
    body: `You received an offer of ₹${input.amount.toLocaleString("en-IN")}.`,
    link: "/offers",
  });
  return data;
}

export type OfferWithListing = Offer & { listing: ListingWithMeta | null };

export async function fetchMyOffers(userId: string): Promise<OfferWithListing[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: listings } = await supabase
    .from("animal_listings")
    .select("*")
    .in("id", [...new Set(rows.map((r) => r.listing_id))]);
  const withMeta = await attachSellers(listings ?? []);
  return rows.map((o) => ({ ...o, listing: withMeta.find((l) => l.id === o.listing_id) ?? null }));
}

export async function respondToOffer(
  offer: Offer,
  action: "accepted" | "rejected" | "countered",
  counterAmount?: number,
) {
  const { error } = await supabase
    .from("offers")
    .update({ status: action, counter_amount: action === "countered" ? counterAmount : null })
    .eq("id", offer.id);
  if (error) throw error;
  await supabase.from("notifications").insert({
    user_id: offer.buyer_id,
    type: `offer_${action}`,
    title:
      action === "accepted" ? "Offer accepted" : action === "rejected" ? "Offer declined" : "Counter offer received",
    body:
      action === "countered"
        ? `Seller countered with ₹${(counterAmount ?? 0).toLocaleString("en-IN")}.`
        : "Open your offers to see the details.",
    link: "/offers",
  });
}

/* ---------- chat ---------- */

export type ConversationWithMeta = Conversation & {
  listing: ListingWithMeta | null;
  other: Pick<Profile, "id" | "full_name" | "avatar_url" | "verification"> | null;
};

export async function fetchConversations(userId: string): Promise<ConversationWithMeta[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: listings } = await supabase
    .from("animal_listings")
    .select("*")
    .in("id", [...new Set(rows.map((r) => r.listing_id))]);
  const withMeta = await attachSellers(listings ?? []);
  const otherIds = rows.map((r) => (r.buyer_id === userId ? r.seller_id : r.buyer_id));
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, verification")
    .in("id", otherIds);
  return rows.map((c) => ({
    ...c,
    listing: withMeta.find((l) => l.id === c.listing_id) ?? null,
    other: (people ?? []).find((p) => p.id === (c.buyer_id === userId ? c.seller_id : c.buyer_id)) ?? null,
  }));
}

export async function startConversation(listing: Listing, buyerId: string) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("listing_id", listing.id)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listing.id, buyer_id: buyerId, seller_id: listing.seller_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendMessage(input: {
  conversation_id: string;
  sender_id: string;
  body?: string;
  image_url?: string;
  kind?: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("messages").insert(input);
  if (error) throw error;
  await supabase
    .from("conversations")
    .update({ last_message: input.body ?? (input.image_url ? "Photo" : "Update"), last_message_at: new Date().toISOString() })
    .eq("id", input.conversation_id);
}

/* ---------- feed store ---------- */

export async function fetchFeedCategories(): Promise<FeedCategory[]> {
  const { data, error } = await supabase.from("feed_categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeedProducts(category?: string, q?: string): Promise<FeedProduct[]> {
  let query = supabase.from("feed_products").select("*").eq("active", true);
  if (category) query = query.eq("category_slug", category);
  if (q) query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchFeedProduct(id: string): Promise<FeedProduct | null> {
  const { data, error } = await supabase.from("feed_products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export type FeedCartItem = { id: string; quantity: number; product: FeedProduct };

export async function fetchFeedCart(userId: string): Promise<FeedCartItem[]> {
  const { data, error } = await supabase
    .from("feed_cart")
    .select("id, quantity, product_id")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];
  const { data: products } = await supabase
    .from("feed_products")
    .select("*")
    .in("id", rows.map((r) => r.product_id));
  return rows
    .map((r) => ({ id: r.id, quantity: r.quantity, product: (products ?? []).find((p) => p.id === r.product_id)! }))
    .filter((r) => Boolean(r.product));
}

export async function addToFeedCart(userId: string, productId: string, quantity = 1) {
  const { data: existing } = await supabase
    .from("feed_cart")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("feed_cart")
      .update({ quantity: Math.min(99, existing.quantity + quantity) })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("feed_cart").insert({ user_id: userId, product_id: productId, quantity });
  if (error) throw error;
}

export async function updateFeedCartItem(id: string, quantity: number) {
  if (quantity <= 0) {
    const { error } = await supabase.from("feed_cart").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("feed_cart").update({ quantity }).eq("id", id);
  if (error) throw error;
}

export const DELIVERY_FEE = 60;
export const FREE_DELIVERY_ABOVE = 2000;

export function deliveryFeeFor(subtotal: number) {
  return subtotal >= FREE_DELIVERY_ABOVE || subtotal === 0 ? 0 : DELIVERY_FEE;
}

export async function fetchMyOrders(userId: string) {
  const { data, error } = await supabase
    .from("feed_orders")
    .select("*, feed_order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ---------- notifications ---------- */

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationsRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export { LISTING_SELECT };
