export type User = {
  staff_id: string;
  username: string;
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
  Remark?: string;
  Potential_Level?: string;
  Potential_Product?: string;
  Potential_Products?: string;
  Notes?: string;
  Activities?: string;
  Documents?: string;
  Source_Channel?: string;
  Message_Date?: string;
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
  Business: string;
  Purpose: string;
  Amount: string;
  Interest: string;
  Loan_Type: string;
  Tenure: string;
  Maturity: string;
  Source_Channel: string;
  Status: string;
  Potential_Level: string;
  Next_Follow_Up: string;
  Potential_Products: string;
  Notes: string;
  Activities: string;
  Documents: string;
  Last_Updated: string;
  _row_number: string | number;
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
  dashboard: DashboardData;
  dailyTasks: DailyTask[];
  crmColumns: string[];
};
