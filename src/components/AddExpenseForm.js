import React, { useState } from "react";
import { addExpense } from "../api";

export default function AddExpenseForm({ onExpenseAdded }) {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: "",
    notes: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await addExpense(form);
    setForm({ amount: "", category: "", date: "", notes: "" });
    onExpenseAdded();
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="amount"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
      />
      <input
        name="category"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
        required
      />
      <input
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        required
      />
      <input
        name="notes"
        placeholder="Notes"
        value={form.notes}
        onChange={handleChange}
      />
      <button type="submit">Add Expense</button>
    </form>
  );
}
