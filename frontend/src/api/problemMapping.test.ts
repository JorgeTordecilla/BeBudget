import { describe, expect, it } from "vitest";

import { ApiProblemError, ApiUnknownError } from "@/api/errors";
import { resolveProblemUi } from "@/api/problemMapping";
import { PROBLEM_TYPE_INVALID_DATE_RANGE, PROBLEM_TYPE_UNAUTHORIZED } from "@/api/problemTypes";

describe("resolveProblemUi", () => {
  it("maps known problem types with presentation", () => {
    const error = new ApiProblemError(
      {
        type: PROBLEM_TYPE_INVALID_DATE_RANGE,
        title: "Invalid date range",
        status: 400,
        detail: "From must be before To"
      },
      { httpStatus: 400, requestId: "req-10", retryAfter: null }
    );

    const ui = resolveProblemUi(error);
    expect(ui.message).toContain("Invalid date range");
    expect(ui.presentation).toBe("inline");
    expect(ui.detail).toBe("From must be before To");
    expect(ui.requestId).toBe("req-10");
  });

  it("maps unauthorized problem to canonical auth message", () => {
    const error = new ApiProblemError(
      {
        type: PROBLEM_TYPE_UNAUTHORIZED,
        title: "Unauthorized",
        status: 401
      },
      { httpStatus: 401, requestId: "req-auth-1", retryAfter: null }
    );

    const ui = resolveProblemUi(error);
    expect(ui.message).toBe("Invalid credentials. Please try again.");
    expect(ui.presentation).toBe("inline");
    expect(ui.requestId).toBe("req-auth-1");
  });

  it("uses validation fallback and friendly detail for unknown 400 auth problems", () => {
    const error = new ApiProblemError(
      {
        type: "about:blank",
        title: "Invalid request",
        status: 400,
        detail: "[{'type': 'string_too_short', 'loc': ('body', 'password'), 'msg': 'String should have at least 12 characters.'}]"
      },
      { httpStatus: 400, requestId: null, retryAfter: null }
    );

    const ui = resolveProblemUi(error, "Unexpected error.", { authFlow: "register" });
    expect(ui.message).toBe("Validation failed. Check your input and try again.");
    expect(ui.presentation).toBe("inline");
    expect(ui.detail).toBe("Password must have at least 12 characters.");
  });

  it("uses safe fallback without raw detail for non-validation unknown problem types", () => {
    const error = new ApiProblemError(
      {
        type: "https://api.bebudget.dev/problems/unknown",
        title: "Some unknown problem",
        status: 500,
        detail: "Traceback: ValueError..."
      },
      { httpStatus: 500, requestId: null, retryAfter: null }
    );
    const ui = resolveProblemUi(error);
    expect(ui.message).toBe("Unexpected error. Please retry.");
    expect(ui.presentation).toBe("toast");
    expect(ui.detail).toBeNull();
  });

  it("maps register username conflict to friendly deterministic message", () => {
    const error = new ApiProblemError(
      {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Username already exists"
      },
      { httpStatus: 409, requestId: "req-conflict", retryAfter: null }
    );
    const ui = resolveProblemUi(error, "Unexpected error.", { authFlow: "register" });
    expect(ui.message).toBe("Username already exists. Try another one.");
    expect(ui.presentation).toBe("inline");
    expect(ui.detail).toBeNull();
  });

  it("maps register email conflict to friendly deterministic message", () => {
    const error = new ApiProblemError(
      {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Email already registered"
      },
      { httpStatus: 409, requestId: "req-conflict-email", retryAfter: null }
    );
    const ui = resolveProblemUi(error, "Unexpected error.", { authFlow: "register" });
    expect(ui.message).toBe("Email already registered. Try another one.");
    expect(ui.presentation).toBe("inline");
    expect(ui.detail).toBeNull();
  });

  it("maps unknown conflict problems to inline detail-first message", () => {
    const error = new ApiProblemError(
      {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Category name already exists for this type"
      },
      { httpStatus: 409, requestId: "req-cat-409", retryAfter: null }
    );

    const ui = resolveProblemUi(error);
    expect(ui.message).toBe("Category name already exists for this type");
    expect(ui.presentation).toBe("inline");
    expect(ui.detail).toBeNull();
    expect(ui.requestId).toBe("req-cat-409");
  });

  it("maps unknown http errors to generic toast", () => {
    const ui = resolveProblemUi(
      new ApiUnknownError("backend_failed", { httpStatus: 500, requestId: "req-11", retryAfter: null })
    );
    expect(ui.message).toBe("Unexpected error. Please retry.");
    expect(ui.presentation).toBe("toast");
    expect(ui.requestId).toBe("req-11");
  });
});

