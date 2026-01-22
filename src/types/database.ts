export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      credibility_sync_logs: {
        Row: {
          ethos_response_hash: string | null
          id: string
          new_credibility: number | null
          new_ethos_score: number | null
          previous_credibility: number | null
          previous_ethos_score: number | null
          sync_source: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          ethos_response_hash?: string | null
          id?: string
          new_credibility?: number | null
          new_ethos_score?: number | null
          previous_credibility?: number | null
          previous_ethos_score?: number | null
          sync_source?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          ethos_response_hash?: string | null
          id?: string
          new_credibility?: number | null
          new_ethos_score?: number | null
          previous_credibility?: number | null
          previous_ethos_score?: number | null
          sync_source?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credibility_sync_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_logs: {
        Row: {
          created_at: string | null
          decision: Database["public"]["Enums"]["resolution_outcome"]
          evidence_hash: string
          extracted_value: string
          fetched_at: string | null
          id: string
          market_id: string
          oracle_type: Database["public"]["Enums"]["oracle_type"]
          sources_queried: Json
        }
        Insert: {
          created_at?: string | null
          decision: Database["public"]["Enums"]["resolution_outcome"]
          evidence_hash: string
          extracted_value: string
          fetched_at?: string | null
          id?: string
          market_id: string
          oracle_type: Database["public"]["Enums"]["oracle_type"]
          sources_queried?: Json
        }
        Update: {
          created_at?: string | null
          decision?: Database["public"]["Enums"]["resolution_outcome"]
          evidence_hash?: string
          extracted_value?: string
          fetched_at?: string | null
          id?: string
          market_id?: string
          oracle_type?: Database["public"]["Enums"]["oracle_type"]
          sources_queried?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evidence_logs_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          locks_at: string
          opens_at: string | null
          oracle_config: Json
          oracle_type: Database["public"]["Enums"]["oracle_type"]
          raw_probability_yes: number | null
          resolution_evidence_id: string | null
          resolution_outcome:
            | Database["public"]["Enums"]["resolution_outcome"]
            | null
          resolution_value: string | null
          resolves_at: string | null
          settled_at: string | null
          status: Database["public"]["Enums"]["market_status"] | null
          title: string
          total_stake_no: number | null
          total_stake_yes: number | null
          total_weighted_stake_no: number | null
          total_weighted_stake_yes: number | null
          updated_at: string | null
          virtual_stake_no: number | null
          virtual_stake_yes: number | null
          weighted_probability_yes: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          locks_at: string
          opens_at?: string | null
          oracle_config?: Json
          oracle_type: Database["public"]["Enums"]["oracle_type"]
          raw_probability_yes?: number | null
          resolution_evidence_id?: string | null
          resolution_outcome?:
            | Database["public"]["Enums"]["resolution_outcome"]
            | null
          resolution_value?: string | null
          resolves_at?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          title: string
          total_stake_no?: number | null
          total_stake_yes?: number | null
          total_weighted_stake_no?: number | null
          total_weighted_stake_yes?: number | null
          updated_at?: string | null
          virtual_stake_no?: number | null
          virtual_stake_yes?: number | null
          weighted_probability_yes?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          locks_at?: string
          opens_at?: string | null
          oracle_config?: Json
          oracle_type?: Database["public"]["Enums"]["oracle_type"]
          raw_probability_yes?: number | null
          resolution_evidence_id?: string | null
          resolution_outcome?:
            | Database["public"]["Enums"]["resolution_outcome"]
            | null
          resolution_value?: string | null
          resolves_at?: string | null
          settled_at?: string | null
          status?: Database["public"]["Enums"]["market_status"] | null
          title?: string
          total_stake_no?: number | null
          total_stake_yes?: number | null
          total_weighted_stake_no?: number | null
          total_weighted_stake_yes?: number | null
          updated_at?: string | null
          virtual_stake_no?: number | null
          virtual_stake_yes?: number | null
          weighted_probability_yes?: number | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string | null
          credibility_at_prediction: number
          id: string
          is_settled: boolean | null
          market_id: string
          payout_amount: number | null
          position: Database["public"]["Enums"]["prediction_position"]
          rep_score_delta: number | null
          settled_at: string | null
          stake_amount: number
          user_id: string
          weighted_stake: number
        }
        Insert: {
          created_at?: string | null
          credibility_at_prediction?: number
          id?: string
          is_settled?: boolean | null
          market_id: string
          payout_amount?: number | null
          position: Database["public"]["Enums"]["prediction_position"]
          rep_score_delta?: number | null
          settled_at?: string | null
          stake_amount: number
          user_id: string
          weighted_stake?: number
        }
        Update: {
          created_at?: string | null
          credibility_at_prediction?: number
          id?: string
          is_settled?: boolean | null
          market_id?: string
          payout_amount?: number | null
          position?: Database["public"]["Enums"]["prediction_position"]
          rep_score_delta?: number | null
          settled_at?: string | null
          stake_amount?: number
          user_id?: string
          weighted_stake?: number
        }
        Relationships: [
          {
            foreignKeyName: "predictions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          evidence_log_id: string | null
          id: string
          losers_pool: number
          market_id: string
          outcome: Database["public"]["Enums"]["resolution_outcome"]
          processed_at: string | null
          settlement_hash: string | null
          total_pool: number
          total_predictions: number
          winners_pool: number
          winning_predictions: number
        }
        Insert: {
          evidence_log_id?: string | null
          id?: string
          losers_pool: number
          market_id: string
          outcome: Database["public"]["Enums"]["resolution_outcome"]
          processed_at?: string | null
          settlement_hash?: string | null
          total_pool: number
          total_predictions: number
          winners_pool: number
          winning_predictions: number
        }
        Update: {
          evidence_log_id?: string | null
          id?: string
          losers_pool?: number
          market_id?: string
          outcome?: Database["public"]["Enums"]["resolution_outcome"]
          processed_at?: string | null
          settlement_hash?: string | null
          total_pool?: number
          total_predictions?: number
          winners_pool?: number
          winning_predictions?: number
        }
        Relationships: [
          {
            foreignKeyName: "settlements_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: true
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          accuracy_rate: number | null
          auth_provider: string | null
          correct_predictions: number | null
          created_at: string | null
          ethos_credibility: number | null
          ethos_last_synced_at: string | null
          ethos_profile_id: number | null
          ethos_score: number | null
          google_email: string | null
          google_id: string | null
          id: string
          locked_rep_score: number | null
          rep_score: number | null
          tier: Database["public"]["Enums"]["credibility_tier"] | null
          total_predictions: number | null
          total_staked: number | null
          total_won: number | null
          twitter_id: string | null
          twitter_username: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          accuracy_rate?: number | null
          auth_provider?: string | null
          correct_predictions?: number | null
          created_at?: string | null
          ethos_credibility?: number | null
          ethos_last_synced_at?: string | null
          ethos_profile_id?: number | null
          ethos_score?: number | null
          google_email?: string | null
          google_id?: string | null
          id?: string
          locked_rep_score?: number | null
          rep_score?: number | null
          tier?: Database["public"]["Enums"]["credibility_tier"] | null
          total_predictions?: number | null
          total_staked?: number | null
          total_won?: number | null
          twitter_id?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          accuracy_rate?: number | null
          auth_provider?: string | null
          correct_predictions?: number | null
          created_at?: string | null
          ethos_credibility?: number | null
          ethos_last_synced_at?: string | null
          ethos_profile_id?: number | null
          ethos_score?: number | null
          google_email?: string | null
          google_id?: string | null
          id?: string
          locked_rep_score?: number | null
          rep_score?: number | null
          tier?: Database["public"]["Enums"]["credibility_tier"] | null
          total_predictions?: number | null
          total_staked?: number | null
          total_won?: number | null
          twitter_id?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_tier: {
        Args: { credibility: number }
        Returns: Database["public"]["Enums"]["credibility_tier"]
      }
      recalculate_market_probabilities: {
        Args: { market_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      credibility_tier: "UNTRUSTED" | "QUESTIONABLE" | "NEUTRAL" | "KNOWN" | "ESTABLISHED" | "REPUTABLE" | "EXEMPLARY" | "DISTINGUISHED" | "REVERED" | "RENOWNED"
      market_status:
        | "DRAFT"
        | "OPEN"
        | "LOCKED"
        | "RESOLVED"
        | "SETTLED"
        | "CANCELLED"
      oracle_type: "price_close" | "metric_threshold" | "count_threshold"
      prediction_position: "YES" | "NO"
      resolution_outcome: "YES" | "NO" | "INVALID"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
