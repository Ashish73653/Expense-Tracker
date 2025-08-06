import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { getCurrentUser, signOut } from "./simpleCognito";
import { getExpenses, addExpense, updateExpense, deleteExpense } from "./api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard' or 'manage'
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [editId, setEditId] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadExpenses(currentUser.userId);
      }
    } catch (error) {
      console.log("No authenticated user");
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (userId) => {
    try {
      const expensesData = await getExpenses(userId || user?.userId);
      // Normalize the data format for Dashboard
      const normalizedExpenses = expensesData.map((exp) => ({
        id: exp.expense_id || exp.id,
        description: exp.notes || exp.description || "Expense",
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
      }));
      setExpenses(normalizedExpenses);
    } catch (error) {
      console.error("Error loading expenses:", error);
      setError("Error loading expenses");
    }
  };

  const handleLogin = async (user) => {
    setUser(user);
    await loadExpenses(user.userId);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setExpenses([]);
      setError("");
      resetForm();
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Error signing out");
    }
  };

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setEditId(null);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setError("");
    if (!amount || !category || !date) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const expense = { amount, category, date, notes };
      if (editId) {
        await updateExpense(editId, expense, user.userId);
        await loadExpenses(); // Reload to get fresh data
        resetForm();
      } else {
        await addExpense(expense, user.userId);
        await loadExpenses(); // Reload to get fresh data
        resetForm();
      }
    } catch (err) {
      console.error("Error saving expense:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      // Find the original expense ID
      const originalExp = expenses.find((exp) => exp.id === id);
      if (originalExp) {
        await deleteExpense(id, user.userId);
        await loadExpenses(); // Reload to get fresh data
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError(err.message);
    }
  };

  const handleEdit = (exp) => {
    setEditId(exp.id);
    setAmount(exp.amount);
    setCategory(exp.category || "");
    setDate(exp.date || "");
    setNotes(exp.description || exp.notes || "");
    setCurrentView("manage"); // Switch to manage view when editing
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
          }}
        ></div>
        <p>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0 }}>💰 Expense Tracker</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <div style={{ textAlign: "right", fontSize: "14px" }}>
              <div>
                <strong>{user.username}</strong>
              </div>
              <div style={{ opacity: 0.8, fontSize: "12px" }}>{user.email}</div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {error && (
          <div
            style={{
              color: "red",
              backgroundColor: "#ffebee",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            borderBottom: "2px solid #e0e0e0",
            paddingBottom: "10px",
          }}
        >
          <button
            onClick={() => setCurrentView("dashboard")}
            style={{
              padding: "10px 20px",
              border: "none",
              background:
                currentView === "dashboard" ? "#007bff" : "transparent",
              color: currentView === "dashboard" ? "white" : "#666",
              cursor: "pointer",
              borderRadius: "5px",
              fontWeight: currentView === "dashboard" ? "bold" : "normal",
            }}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setCurrentView("manage")}
            style={{
              padding: "10px 20px",
              border: "none",
              background: currentView === "manage" ? "#007bff" : "transparent",
              color: currentView === "manage" ? "white" : "#666",
              cursor: "pointer",
              borderRadius: "5px",
              fontWeight: currentView === "manage" ? "bold" : "normal",
            }}
          >
            📝 Manage Expenses
          </button>
        </div>

        {/* Content */}
        {currentView === "dashboard" ? (
          <Dashboard expenses={expenses} user={user} />
        ) : (
          <div>
            {/* Add/Edit Expense Form */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                marginBottom: "20px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h3>{editId ? "Edit Expense" : "Add New Expense"}</h3>
              <form
                onSubmit={handleAddOrUpdate}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  alignItems: "end",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Amount*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Category*
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Food">🍕 Food</option>
                    <option value="Transportation">🚗 Transportation</option>
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Bills">📄 Bills</option>
                    <option value="Healthcare">🏥 Healthcare</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Date*
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                    }}
                    placeholder="Optional description"
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="submit"
                    style={{
                      background: editId
                        ? "#ffc107"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: editId ? "#000" : "white",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {editId ? "Update" : "Add"} Expense
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        padding: "12px 20px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Expenses List */}
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                border: "1px solid #e0e0e0",
              }}
            >
              <h3>Your Expenses ({expenses.length})</h3>
              {expenses.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                    💸
                  </div>
                  <p>No expenses yet. Add your first expense above!</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "15px",
                        background: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: "bold", marginBottom: "5px" }}
                        >
                          {expense.description || "Expense"}
                        </div>
                        <div style={{ color: "#666", fontSize: "14px" }}>
                          {expense.category} •{" "}
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#007bff",
                          }}
                        >
                          ${parseFloat(expense.amount).toFixed(2)}
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleEdit(expense)}
                            style={{
                              background: "#007bff",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "3px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            style={{
                              background: "#dc3545",
                              color: "white",
                              border: "none",
                              padding: "5px 10px",
                              borderRadius: "3px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
