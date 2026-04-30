// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { NavigationAction } from "@/components/navigation/navigation-action";

vi.mock("@/components/action-tooltip", () => ({
  ActionTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("NavigationAction UI", () => {
  it("applies hover utility classes for shape and colors", () => {
    const { container } = render(<NavigationAction />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("group");

    const iconWrapper = container.querySelector("button > div");
    expect(iconWrapper).not.toBeNull();
    expect(iconWrapper?.className).toContain("group-hover:rounded-[16px]");
    expect(iconWrapper?.className).toContain("group-hover:bg-emerald-500");
    expect(iconWrapper?.className).toContain("dark:group-hover:bg-emerald-500");

    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    const iconClassName = icon?.getAttribute("class") ?? "";
    expect(iconClassName).toContain("group-hover:text-white");
    expect(iconClassName).toContain("dark:group-hover:text-white");
  });
});
