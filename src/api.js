// Real Cognito authentication with AWS backend
// All AWS infrastructure (Lambda, DynamoDB, API Gateway) remains active

import { getAuthToken } from "./simpleCognito";

const API_BASE =
  "https://go105ho49d.execute-api.eu-north-1.amazonaws.com/dev/expenses/";

export async function addExpense(expense, userId) {
  const token = await getAuthToken();
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...expense,
      user_id: userId,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add expense: ${errorText}`);
  }
  return response.json();
}

export async function getExpenses(userId) {
  const token = await getAuthToken();
  const response = await fetch(API_BASE + `?user_id=${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch expenses: ${errorText}`);
  }
  return response.json();
}

export async function deleteExpense(expense_id, userId) {
  const token = await getAuthToken();
  const response = await fetch(API_BASE + "expense/" + expense_id, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete expense: ${errorText}`);
  }
  return response.json();
}

export async function updateExpense(expense_id, updatedFields, userId) {
  const token = await getAuthToken();
  const response = await fetch(API_BASE + "expense/" + expense_id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...updatedFields,
      user_id: userId,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update expense: ${errorText}`);
  }
  return response.json();
}
