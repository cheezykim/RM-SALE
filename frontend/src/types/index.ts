export type User = {
  staff_id: string;
  username: string;
  tele_id: string;
  role: string;
  branch: string;
  allowed_sources: "all" | string[];
};

export type VisitCustomer = {
  Sender_Name?: string;
  Name?: string;
  Tel?: string;
  Rank?: string;
  Bank?: string;
  Business?: string;
  Purpose?: string;
  Amount?: string;
  Interest?: string;
  Loan_Type?: string;
  Tenure?: string;
  Maturity?: string;
  Source_Type?: string;
  Remark?: string;
  Potential_Level?: string;
  Potential_Product?: string;
  Potential_Products?: string;
  Notes?: string;
  Activities?: string;
  Documents?: string;
  Source_Channel?: string;
  Message_Date?: string;
  Entry_Type?: string;
  _row_number?: string | number;
  [key: string]: unknown;
};

export type PotentialCustomer = {
  Customer_Key: string;
  Salesperson_ID: string;
  Salesperson_Name: string;
  Date_Added: string;
  Sender_Name: string;
  Name: string;
  Tel: string;
  Rank: string;
  Bank?: string;
  Business: string;
  Purpose: string;
  Amount: string;
  Interest: string;
  Loan_Type: string;
  Tenure: string;
  Maturity: string;
  Source_Type?: string;
  Source_Channel: string;
  Status: string;
  Potential_Level: string;
  Next_Follow_Up: string;
  Potential_Products: string;
  Remark?: string;
  Notes: string;
  Activities: string;
  Documents: string;
  Last_Updated: string;
  _row_number: string | number;
  [key: string]: unknown;
};

export type MerchantRecord = {
  _row_number?: string | number;
  [key: string]: unknown;
};

export type DailyTask = {
  start_time: string;
  end_time: string;
  activity: string;
  location: string;
  num_customers: string;
  customers: Array<{ name: string; contact: string; biz: string }>;
};

export type ReportSubmission = {
  ok: boolean;
  message: string;
  report_id: string;
  pdf_url: string;
  submitted_at: string;
};

export type DashboardData = {
  metrics: {
    totalVisitsThisMonth: number;
    potentialCustomers: number;
    followUpsDue: number;
    convertedCustomers: number;
    expectedLoanAmount: number;
  };
  recentActivities: string[];
  upcomingFollowUps: PotentialCustomer[];
};

export type BootstrapData = {
  navigation: string[];
  visits: VisitCustomer[];
  potentials: PotentialCustomer[];
  merchants: MerchantRecord[];
  dashboard: DashboardData;
  dailyTasks: DailyTask[];
  crmColumns: string[];
};
