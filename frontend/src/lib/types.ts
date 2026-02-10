export interface DashboardSummary {
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  monthly_income: number;
  monthly_expenses: number;
  cash_flow: number;
  credit_utilization_pct: number;
  upcoming_bills: UpcomingBill[];
  goals_summary: GoalSummary[];
  recent_transactions: RecentTransaction[];
}

export interface UpcomingBill {
  description: string;
  amount: number;
  due_date: string;
  category: string;
}

export interface GoalSummary {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress_pct: number;
}

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  transaction_type: string;
  category: string;
  date: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  transaction_type: string;
  category: string | null;
  description: string | null;
  date: string;
  created_at: string;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string | null;
  credit_limit: number;
  current_balance: number;
  statement_day: number;
  due_day: number;
  apr: number | null;
  min_payment_pct: number;
  utilization_pct: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  is_recurring: boolean;
  frequency: string | null;
  next_due_date: string | null;
}

export interface Investment {
  id: string;
  investment_type: string;
  institution: string | null;
  current_value: number;
  book_value: number;
  monthly_contribution: number;
  gain_loss: number;
}

export interface Goal {
  id: string;
  title: string;
  goal_type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  progress_pct: number;
  on_track: boolean | null;
  monthly_needed: number | null;
  days_remaining: number | null;
}

export interface AnalysisInsight {
  priority: number;
  category: string;
  message: string;
  detail: string;
}

export interface AnalysisWarning {
  severity: string;
  category: string;
  message: string;
}

export interface AnalysisRecommendation {
  action: string;
  impact: string;
  detail: string;
}

export interface AnalysisResponse {
  snapshot_date: string;
  insights: AnalysisInsight[];
  warnings: AnalysisWarning[];
  recommendations: AnalysisRecommendation[];
  summary: string;
}
