export type MockReportRoleKey = "ADMIN" | "BGD" | "QLDT" | "KP" | "BCN";

export type MockReportAccount = {
  key: MockReportRoleKey;
  username: string;
  password: string;
  label: string;
  role: string;
  unit?: string;
  canViewAll: boolean;
};

export const MOCK_REPORT_AUTH_KEY = "qlqtdt_mock_report_account";

export const MOCK_REPORT_ACCOUNTS: MockReportAccount[] = [
  {
    key: "ADMIN",
    username: "admin",
    password: "Admin@1234",
    label: "Admin hệ thống",
    role: "ADMIN",
    canViewAll: true,
  },
  {
    key: "BGD",
    username: "bgd",
    password: "Bgd@1234",
    label: "Ban Giám đốc",
    role: "BGĐ",
    canViewAll: true,
  },
  {
    key: "QLDT",
    username: "qldt",
    password: "Qldt@1234",
    label: "Phòng QLĐT",
    role: "PHÒNG QLĐT",
    canViewAll: true,
  },
  {
    key: "KP",
    username: "kp_noi",
    password: "Kpnoi@1234",
    label: "Khoa/Phòng - Khoa Nội",
    role: "K/P",
    unit: "Khoa Nội",
    canViewAll: false,
  },
  {
    key: "BCN",
    username: "bcn_noi",
    password: "Bcnnoi@1234",
    label: "BCN Khoa Nội",
    role: "BCN",
    unit: "Khoa Nội",
    canViewAll: false,
  },
];

export function getMockReportAccountByKey(key?: string | null) {
  return MOCK_REPORT_ACCOUNTS.find((account) => account.key === key) ?? MOCK_REPORT_ACCOUNTS[0];
}

export function getCurrentMockReportAccount() {
  try {
    return getMockReportAccountByKey(localStorage.getItem(MOCK_REPORT_AUTH_KEY));
  } catch {
    return MOCK_REPORT_ACCOUNTS[0];
  }
}

export function setCurrentMockReportAccount(account: MockReportAccount) {
  localStorage.setItem(MOCK_REPORT_AUTH_KEY, account.key);
}
