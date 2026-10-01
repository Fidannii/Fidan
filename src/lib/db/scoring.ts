import type { Lead } from "@/lib/db/types";

export function scoreLead(lead: Partial<Lead>): number {
  let score = 20;
  if (lead.full_name) score += 15;
  if (lead.phone) score += 20;
  if (lead.email) score += 10;
  if (lead.intent) score += 10;
  if (lead.budget_max || lead.budget_min) score += 15;
  if (lead.preferred_locations && lead.preferred_locations.length > 0) {
    score += 10;
  }
  if (lead.urgency === "high") score += 10;
  else if (lead.urgency === "medium") score += 5;
  return Math.min(100, score);
}
