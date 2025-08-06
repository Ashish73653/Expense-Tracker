import React, { useState } from "react";
import { Amplify } from "aws-amplify";

const DiagnosticTool = () => {
  const [diagnostics, setDiagnostics] = useState(null);

  const runDiagnostics = () => {
    const config = Amplify.getConfig();
    const currentUrl = window.location.origin;

    const diagnosticInfo = {
      currentUrl,
      currentFullUrl: window.location.href,
      cognitoConfig: {
        userPoolId: config.Auth?.Cognito?.userPoolId,
        userPoolClientId: config.Auth?.Cognito?.userPoolClientId,
        cognitoDomain: config.Auth?.Cognito?.loginWith?.oauth?.domain,
        configuredRedirectSignIn:
          config.Auth?.Cognito?.loginWith?.oauth?.redirectSignIn,
        configuredRedirectSignOut:
          config.Auth?.Cognito?.loginWith?.oauth?.redirectSignOut,
        scopes: config.Auth?.Cognito?.loginWith?.oauth?.scopes,
      },
      urlParams: Object.fromEntries(
        new URLSearchParams(window.location.search)
      ),
      localStorage: {
        amplifyKeys: Object.keys(localStorage).filter(
          (key) =>
            key.includes("amplify") ||
            key.includes("cognito") ||
            key.includes("aws")
        ),
      },
    };

    setDiagnostics(diagnosticInfo);
  };

  const clearAllSessions = () => {
    localStorage.clear();
    sessionStorage.clear();
    alert("All sessions cleared! Try signing in again.");
    window.location.reload();
  };

  const generateCognitoUrl = () => {
    const config = Amplify.getConfig();
    const domain = config.Auth?.Cognito?.loginWith?.oauth?.domain;
    const clientId = config.Auth?.Cognito?.userPoolClientId;
    const redirectUri = encodeURIComponent(window.location.origin + "/");
    const scopes =
      config.Auth?.Cognito?.loginWith?.oauth?.scopes?.join("+") ||
      "email+openid+phone";

    return `https://${domain}/login?client_id=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${redirectUri}`;
  };

  return (
    <div
      style={{
        padding: "20px",
        margin: "20px 0",
        border: "2px solid #007bff",
        borderRadius: "8px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3>🔧 AWS Cognito Configuration Diagnostics</h3>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={runDiagnostics}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔍 Run Diagnostics
        </button>

        <button
          onClick={clearAllSessions}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🧹 Clear All Sessions
        </button>

        <button
          onClick={() => window.open(generateCognitoUrl(), "_blank")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🚀 Test Direct Cognito URL
        </button>
      </div>

      {diagnostics && (
        <div>
          <h4>📊 Current Configuration Analysis:</h4>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #ddd",
            }}
          >
            <h5>🌐 URL Information:</h5>
            <p>
              <strong>Current URL:</strong> {diagnostics.currentUrl}
            </p>
            <p>
              <strong>Full URL:</strong> {diagnostics.currentFullUrl}
            </p>
            {Object.keys(diagnostics.urlParams).length > 0 && (
              <div>
                <strong>URL Parameters:</strong>
                <pre
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f8f9fa",
                    padding: "8px",
                  }}
                >
                  {JSON.stringify(diagnostics.urlParams, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
              border: "1px solid #ddd",
            }}
          >
            <h5>⚙️ Amplify Configuration:</h5>
            <pre
              style={{
                fontSize: "12px",
                backgroundColor: "#f8f9fa",
                padding: "10px",
                overflow: "auto",
                maxHeight: "300px",
              }}
            >
              {JSON.stringify(diagnostics.cognitoConfig, null, 2)}
            </pre>
          </div>

          <div
            style={{
              backgroundColor: diagnostics.currentUrl.includes("localhost")
                ? "#fff3cd"
                : "#d4edda",
              padding: "15px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <h5>🎯 Action Required in AWS Cognito Console:</h5>

            {diagnostics.currentUrl.includes("localhost") ? (
              <div>
                <p style={{ color: "#856404" }}>
                  <strong>⚠️ You're on localhost - UPDATE REQUIRED:</strong>
                </p>
                <ol>
                  <li>
                    Go to <strong>AWS Cognito Console</strong>
                  </li>
                  <li>
                    Navigate to User Pool: <code>eu-north-1_Bq4EEZx8x</code>
                  </li>
                  <li>
                    Go to <strong>App integration</strong> →{" "}
                    <strong>App clients</strong>
                  </li>
                  <li>
                    Select your app client:{" "}
                    <code>69otpcp4a838cg40jln9ropdqv</code>
                  </li>
                  <li>
                    Click <strong>Edit</strong> under <strong>Hosted UI</strong>
                  </li>
                  <li>
                    <strong>Update Callback URLs to include:</strong>
                    <br />
                    <code>https://d84l1y8p4kdic.cloudfront.net/</code>
                    <br />
                    <code>{diagnostics.currentUrl}/</code>
                  </li>
                  <li>
                    <strong>Update Sign-out URLs to include:</strong>
                    <br />
                    <code>https://d84l1y8p4kdic.cloudfront.net/</code>
                    <br />
                    <code>{diagnostics.currentUrl}/</code>
                  </li>
                  <li>
                    <strong>Save changes</strong>
                  </li>
                </ol>
              </div>
            ) : (
              <div>
                <p style={{ color: "#155724" }}>
                  <strong>✅ Production environment detected</strong>
                </p>
                <p>Your current configuration should work for production.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h5>🔗 Test URLs:</h5>
            <p>
              <strong>Generated Cognito Login URL:</strong>
            </p>
            <textarea
              readOnly
              value={generateCognitoUrl()}
              style={{
                width: "100%",
                height: "60px",
                fontSize: "12px",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticTool;
