// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL = "https://afri-spender-backend.onrender.com";

const TOKEN_KEY = "afri_access_token";


// =========================================================
// GENERIC REQUEST FUNCTION
// =========================================================

async function request(
  endpoint,
  options = {}
) {
  const {
    method = "GET",
    body,
    headers = {},
    credentials,
  } = options;


  const token = localStorage.getItem(
    TOKEN_KEY
  );


  const requestHeaders = {
    ...headers,
  };


  if (token) {
    requestHeaders.Authorization =
      `Bearer ${token}`;
  }


  let requestBody = body;


  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams)
  ) {
    requestHeaders["Content-Type"] =
      "application/json";

    requestBody = JSON.stringify(body);
  }


  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials:
  credentials || "include",
    }
  );


  let data = null;


  try {
    data = await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {

    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;


    throw new Error(message);
  }


  return data;
}


// =========================================================
// REGISTER
// =========================================================

export async function registerUser(
  email,
  password,
  currency = "NGN"
) {

  return request(
    "/users/register",
    {
      method: "POST",

      body: {
        email,
        password,
        currency,
      },
    }
  );
}


// =========================================================
// LOGIN
// =========================================================

export async function loginUser(
  email,
  password
) {

  const formData =
    new URLSearchParams();


  formData.append(
    "username",
    email
  );


  formData.append(
    "password",
    password
  );


  const data = await request(
    "/users/login",
    {
      method: "POST",

      body: formData,

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );


  if (data?.access_token) {

    localStorage.setItem(
      TOKEN_KEY,
      data.access_token
    );
  }


  return data;
}


// =========================================================
// GOOGLE LOGIN URL
// =========================================================

export function getGoogleLoginUrl(
  platform = "web"
) {
  return (
    `${API_BASE_URL}/users/google/login?platform=${platform}`
  );
}


// =========================================================
// GOOGLE CODE EXCHANGE
// =========================================================

export async function exchangeGoogleCode(
  code
) {

  const data = await request(
    "/users/google/exchange",
    {
      method: "POST",

      body: {
        code,
      },

      credentials: "include",
    }
  );


  if (data?.access_token) {

    localStorage.setItem(
      TOKEN_KEY,
      data.access_token
    );
  }


  return data;
}


// =========================================================
// AUTH CHECK
// =========================================================

export function isAuthenticated() {

  return Boolean(
    localStorage.getItem(
      TOKEN_KEY
    )
  );
}


// =========================================================
// LOGOUT
// =========================================================

export function logoutUser() {

  localStorage.removeItem(
    TOKEN_KEY
  );
}


// =========================================================
// GET CURRENT USER
// =========================================================

export async function getMyProfile() {

  return request(
    "/users/me"
  );
}


// =========================================================
// UPDATE CURRENCY
// =========================================================

export async function updateMyCurrency(
  currency
) {

  return request(
    "/users/me/currency",
    {
      method: "PATCH",

      body: {
        currency,
      },
    }
  );
}


// =========================================================
// TRANSACTIONS
// =========================================================

export async function getTransactions() {

  return request(
    "/transactions"
  );
}


export async function createTransaction(
  transaction
) {

  return request(
    "/transactions",
    {
      method: "POST",
      body: transaction,
    }
  );
}


export async function deleteTransaction(
  transactionId
) {

  return request(
    `/transactions/${transactionId}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// DASHBOARD
// =========================================================

export async function getDashboard() {

  return request(
    "/dashboard"
  );
}


// =========================================================
// ANALYTICS
// =========================================================

export async function getAnalytics() {

  return request(
    "/analytics"
  );
}


// =========================================================
// BUDGETS
// =========================================================

export async function getBudgets() {

  return request(
    "/budgets"
  );
}


export async function createBudget(
  budget
) {

  return request(
    "/budgets",
    {
      method: "POST",
      body: budget,
    }
  );
}


export async function updateBudget(
  budgetId,
  budget
) {

  return request(
    `/budgets/${budgetId}`,
    {
      method: "PUT",
      body: budget,
    }
  );
}


export async function deleteBudget(
  budgetId
) {

  return request(
    `/budgets/${budgetId}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// EXPORT TOKEN KEY
// =========================================================

export {
  TOKEN_KEY,
};