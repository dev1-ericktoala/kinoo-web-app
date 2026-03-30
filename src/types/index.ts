// ─── Enums ───────────────────────────────────────────────

export type PromotionType = "promotion" | "service"
export type PromotionStatus = "active" | "inactive" | "pending_review" | "rejected"
export type BenefitType = "discount" | "free_product" | "service" | "points_only"

// ─── Auth ────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_id: string
  supabase_access_token?: string | null
  supabase_refresh_token?: string | null
}

export interface LoginRequest {
  email: string
}

export interface VerifyCodeRequest {
  email: string
  code: string
}

// ─── User ────────────────────────────────────────────────

export interface UserResponse {
  id: string
  full_name: string
  email: string
  profile_photo_url: string | null
  age: number | null
  gender_id: string | null
  gender_code: string | null
  country_id: string | null
  country_name: string | null
  city_id: string | null
  city_name: string | null
  role_id: string | null
  role_code: string | null
  status_id: string | null
  group_id: string | null
  group_name: string | null
  registration_step: number
  registration_completed: boolean
  version: number
  created_at: string
  referral_code: string | null
  referral_points: number
  referral_validated_count: number
  interest_codes: string[] | null
}

// ─── Promotion ───────────────────────────────────────────

export interface Promotion {
  id: string
  provider_id: string | null
  type: PromotionType
  title: string
  description: string | null
  benefit_type: BenefitType
  image_url: string | null
  link: string | null
  coupon_code: string | null
  redeem_message: string
  points_required: number
  country_id: string | null
  city_id: string | null
  targeting: Record<string, unknown>
  is_featured_eligible: boolean
  business_name: string | null
  business_address: string | null
  business_phone: string | null
  business_email: string | null
  business_whatsapp: string | null
  service_price: number | null
  is_presential: boolean
  is_referral_only: boolean
  min_referral_points_required: number
  points_cost: number
  stock_total: number | null
  stock_remaining: number | null
  is_single_use_per_user: boolean
  start_date: string
  end_date: string
  is_active: boolean
  status: PromotionStatus
  deactivated_at: string | null
  deactivation_reason: string | null
  created_at: string
  updated_at: string
  redemptions_count: number
}

export interface CreatePromotionRequest {
  provider_id?: string | null
  type?: PromotionType
  title: string
  description?: string | null
  benefit_type: BenefitType
  image_url?: string | null
  link?: string | null
  coupon_code?: string | null
  redeem_message?: string | null
  points_required?: number
  country_id?: string | null
  city_id?: string | null
  targeting?: Record<string, unknown>
  is_featured_eligible?: boolean
  business_name?: string | null
  business_address?: string | null
  business_phone?: string | null
  business_email?: string | null
  business_whatsapp?: string | null
  service_price?: number | null
  is_presential?: boolean
  is_referral_only?: boolean
  min_referral_points_required?: number
  points_cost?: number
  stock_total?: number | null
  is_single_use_per_user?: boolean
  start_date: string
  end_date: string
  is_active?: boolean
  status?: PromotionStatus
}

export interface UpdatePromotionRequest {
  type?: PromotionType | null
  title?: string | null
  description?: string | null
  benefit_type?: BenefitType | null
  image_url?: string | null
  link?: string | null
  coupon_code?: string | null
  redeem_message?: string | null
  points_required?: number | null
  country_id?: string | null
  city_id?: string | null
  targeting?: Record<string, unknown> | null
  is_featured_eligible?: boolean | null
  business_name?: string | null
  business_address?: string | null
  business_phone?: string | null
  business_email?: string | null
  business_whatsapp?: string | null
  service_price?: number | null
  is_presential?: boolean | null
  is_referral_only?: boolean | null
  min_referral_points_required?: number | null
  points_cost?: number | null
  stock_total?: number | null
  stock_remaining?: number | null
  is_single_use_per_user?: boolean | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean | null
  status?: PromotionStatus | null
  deactivated_at?: string | null
  deactivation_reason?: string | null
}

// ─── Places & Locations ─────────────────────────────────

export interface PlaceResult {
  id: string
  place_id: string
  address: string | null
  city: string | null
  country: string | null
  lat: number
  lng: number
  source: "cache" | "google"
}

export type CoverageType = "point" | "city"

export interface PromotionLocation {
  id: string
  promotion_id: string
  coverage_type: CoverageType
  place: PlaceResult
  created_at: string
}

// ─── Lookup ──────────────────────────────────────────────

export interface Country {
  id: string
  name: string
}

export interface City {
  id: string
  name: string
  country_id: string
}

export interface Breed {
  id: string
  name: string
  species_id?: string
}

// ─── Pet Targeting ──────────────────────────────────────

export interface PetFilters {
  species?: string[]
  sex?: string[]
  age_categories?: string[]
  breeds?: string[]
  health?: string
  vaccinated?: boolean
  sterilized?: boolean
  dewormed_internal?: boolean
  dewormed_external?: boolean
  takes_medication?: boolean
  weight_status?: string[]
  behavior?: {
    aggressive?: boolean
    separation_anxiety?: boolean
    phobias?: boolean
  }
  identification?: {
    has_collar_id?: boolean
    has_microchip?: boolean
  }
  supplements?: {
    has_vitamins?: boolean
    has_supplements?: boolean
  }
}
