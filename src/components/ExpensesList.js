import React, { useEffect, useState } from "react";
import { getExpenses, deleteExpense } from "../api";

export default function ExpensesList() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  async function handleDelete(id) {
    await deleteExpense(id);
    fetchExpenses();
  }

  return (
    <ul>
      {expenses.map((expense) => (
        <li key={expense.expense_id}>
          {expense.category} - {expense.amount} on {expense.date}
          <button onClick={() => handleDelete(expense.expense_id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
