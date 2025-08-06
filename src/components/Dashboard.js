import React, { useState, useEffect } from "react";
import AddExpenseForm from "./AddExpenseForm";
import ExpensesList from "./ExpensesList";
import ChartDashboard from "./ChartDashboard";
import { getExpenses } from "../api";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);

  async function refreshExpenses() {
    const data = await getExpenses();
    setExpenses(data);
  }

  useEffect(() => {
    refreshExpenses();
  }, []);

  return (
    <div>
      <AddExpenseForm onExpenseAdded={refreshExpenses} />
      <ExpensesList />
      <ChartDashboard expenses={expenses} />
    </div>
  );
}
