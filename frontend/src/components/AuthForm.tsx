"use client";

import React, { useState } from "react";
import { apiFetch, storeAuth } from "@/lib/api";

interface AuthFormProps {
  onAuthSuccess: (username: string) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/v1/user/login" : "/api/v1/user/register";
      const response = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Authentication failed. Please check credentials.");
      }

      if (!isLogin) {
        const loginResponse = await apiFetch("/api/v1/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok || loginData.success === false) {
          throw new Error(loginData.message || "Failed to log in after registration.");
        }
        if (loginData.token) {
          storeAuth(username, loginData.token);
        }
      } else if (data.token) {
        storeAuth(username, data.token);
      }

      onAuthSuccess(username);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal animate-scale-in" style={{ maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="upload-icon" style={{ margin: "0 auto 12px", width: "56px", height: "56px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 style={{ fontSize: "22px", color: "var(--ink)", marginBottom: "4px" }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--ink-soft)" }}>
            {isLogin
              ? "Access the AI-powered GrowEasy CSV Importer"
              : "Register to start parsing and mapping leads"}
          </p>
        </div>

        {error && (
          <div className="banner banner-warning animate-fade-in" style={{ fontSize: "13px", padding: "10px 12px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. demo_user"
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="input-group animate-fade-in">
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "12px", height: "42px" }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }} />
            ) : isLogin ? (
              "Log In"
            ) : (
              "Register & Log In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px" }}>
          <span style={{ color: "var(--ink-soft)" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: "600",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isLogin ? "Create one" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
