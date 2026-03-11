import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { ApiClient } from "@/api/client";
import { AuthContext } from "@/auth/AuthContext";
import RequireAuth from "@/routes/RequireAuth";

const apiClientStub = {} as ApiClient;
type AuthContextValue = NonNullable<Parameters<typeof AuthContext.Provider>[0]["value"]>;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderWithAuth(value: Parameters<typeof AuthContext.Provider>[0]["value"]) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <RequireAuth>
                <div>Private area</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("RequireAuth", () => {
  it("renders protected content immediately when cached user exists without token", () => {
    const bootstrapSession = vi.fn(async () => true);
    renderWithAuth({
      apiClient: apiClientStub,
      user: { id: "u1", username: "demo", currency_code: "USD" },
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: async () => undefined,
      register: async () => undefined,
      logout: async () => undefined,
      bootstrapSession
    });
    expect(screen.getByText("Private area")).toBeInTheDocument();
    expect(screen.queryByText("Checking session...")).not.toBeInTheDocument();
    expect(bootstrapSession).not.toHaveBeenCalled();
  });

  it("keeps content visible when user exists and bootstrap is in progress", () => {
    renderWithAuth({
      apiClient: apiClientStub,
      user: { id: "u1", username: "demo", currency_code: "USD" },
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: true,
      login: async () => undefined,
      register: async () => undefined,
      logout: async () => undefined,
      bootstrapSession: async () => true
    });
    expect(screen.getByText("Private area")).toBeInTheDocument();
    expect(screen.queryByText("Checking session...")).not.toBeInTheDocument();
  });

  it("shows loader while auth bootstrap is in progress", () => {
    renderWithAuth({
      apiClient: apiClientStub,
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: true,
      login: async () => undefined,
      register: async () => undefined,
      logout: async () => undefined,
      bootstrapSession: async () => false
    });
    expect(screen.getByText("Checking session...")).toBeInTheDocument();
  });

  it("restores protected content after bootstrap succeeds from an unauthenticated start", async () => {
    const bootstrap = createDeferred<boolean>();

    function BootstrapSuccessHarness() {
      const [value, setValue] = useState<AuthContextValue>({
        apiClient: apiClientStub,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isBootstrapping: false,
        login: async () => undefined,
        register: async () => undefined,
        logout: async () => undefined,
        bootstrapSession: () =>
          bootstrap.promise.then(() => {
            setValue((current) => ({
              ...current,
              user: { id: "u1", username: "demo", currency_code: "USD" },
              accessToken: "token",
              isAuthenticated: true
            }));
            return true;
          })
      });

      return (
        <AuthContext.Provider value={value}>
          <MemoryRouter initialEntries={["/app"]}>
            <Routes>
              <Route
                path="/app"
                element={(
                  <RequireAuth>
                    <div>Private area</div>
                  </RequireAuth>
                )}
              />
              <Route path="/login" element={<div>Login page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    }

    render(<BootstrapSuccessHarness />);
    expect(screen.getByText("Checking session...")).toBeInTheDocument();
    bootstrap.resolve(true);
    await waitFor(() => expect(screen.getByText("Private area")).toBeInTheDocument());
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", () => {
    renderWithAuth({
      apiClient: apiClientStub,
      user: { id: "u1", username: "demo", currency_code: "USD" },
      accessToken: "token",
      isAuthenticated: true,
      isBootstrapping: false,
      login: async () => undefined,
      register: async () => undefined,
      logout: async () => undefined,
      bootstrapSession: async () => true
    });
    expect(screen.getByText("Private area")).toBeInTheDocument();
  });

  it("redirects to login only after bootstrap resolves unauthenticated", async () => {
    const bootstrap = createDeferred<boolean>();
    const bootstrapSession = vi.fn(() => bootstrap.promise);
    renderWithAuth({
      apiClient: apiClientStub,
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: async () => undefined,
      register: async () => undefined,
      logout: async () => undefined,
      bootstrapSession
    });
    expect(screen.getByText("Checking session...")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
    bootstrap.resolve(false);
    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
    expect(bootstrapSession).toHaveBeenCalledTimes(1);
  });

  it("keeps protected route inaccessible on history navigation when unauthenticated", async () => {
    const bootstrapSession = vi.fn(async () => false);
    render(
      <AuthContext.Provider
        value={{
          apiClient: apiClientStub,
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isBootstrapping: false,
          login: async () => undefined,
          register: async () => undefined,
          logout: async () => undefined,
          bootstrapSession
        }}
      >
        <MemoryRouter initialEntries={["/login", "/app"]} initialIndex={1}>
          <Routes>
            <Route
              path="/app"
              element={(
                <RequireAuth>
                  <div>Private area</div>
                </RequireAuth>
              )}
            />
            <Route path="/login" element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => expect(screen.getByText("Login page")).toBeInTheDocument());
    expect(screen.queryByText("Private area")).not.toBeInTheDocument();
    expect(bootstrapSession).toHaveBeenCalledTimes(1);
  });
});
