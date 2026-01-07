import { supabase } from "../supabaseClient";

export interface CreditScoreEvent {
  id: number;
  user_id: number;
  change: number;
  reason?: string | null;
  created_at: string;
}

export async function getUserCreditScoreHistory(userId: number) {
  if (!userId) return [] as CreditScoreEvent[];

  const { data, error } = await supabase
    .from("credit_score_history")
    .select("id, user_id, change, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("getUserCreditScoreHistory error", error);
    throw error;
  }

  return data || [];
}
