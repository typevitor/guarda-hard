// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { FeedbackBanner } from "./feedback-banner";

describe("FeedbackBanner", () => {
  it("renders success role and message", () => {
    render(<FeedbackBanner type="success" message="Registro salvo" />);

    expect(screen.getByRole("status").textContent).toContain("Registro salvo");
  });

  it("renders error role and message", () => {
    render(<FeedbackBanner type="error" message="Falha ao salvar" />);

    expect(screen.getByRole("alert").textContent).toContain("Falha ao salvar");
  });
});
