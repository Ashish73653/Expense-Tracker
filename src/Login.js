import React, { useState } from "react";
import { signInWithEmail } from "./simpleCognito";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      console.log("🔐 Attempting sign in for:", email);

      const result = await signInWithEmail(email, password);

      console.log("✅ Sign in successful:", result);

      onLogin({
        userId: result.userId,
        username: result.username,
        email: result.email,
      });
    } catch (error) {
      console.error("❌ Sign in error:", error);
      setError(error.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h2
          style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}
        >
          💰 Expense Tracker
        </h2>

        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "block", marginBottom: "8px", color: "#333" }}
            >
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "block", marginBottom: "8px", color: "#333" }}
            >
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "red",
                backgroundColor: "#ffebee",
                padding: "10px",
                borderRadius: "4px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              cursor:
                loading || !email || !password ? "not-allowed" : "pointer",
              opacity: loading || !email || !password ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#856404",
            border: "1px solid #ffeaa7",
          }}
        >
          <strong>� Demo Mode Notice</strong>
          <p style={{ margin: "8px 0" }}>
            Full OAuth/SSO login authorization feature is coming soon! Currently
            using demo Cognito users for testing.
          </p>
        </div>

        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#0066cc",
          }}
        >
          <strong>🏗️ Full-Stack AWS Architecture</strong>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            <li>✅ AWS Cognito User Pool Authentication</li>
            <li>✅ AWS Lambda Functions (CRUD Operations)</li>
            <li>✅ Amazon DynamoDB (NoSQL Database)</li>
            <li>✅ AWS API Gateway (REST API)</li>
            <li>✅ React Frontend with Chart.js Analytics</li>
            <li>✅ JWT Token-based Security</li>
            <li>✅ User-specific Data Isolation</li>
            <li>✅ Real-time Expense Tracking & Analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
