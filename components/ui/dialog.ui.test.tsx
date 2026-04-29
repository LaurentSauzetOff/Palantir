// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

describe("Dialog UI", () => {
  it("opens from the trigger and closes with the close button", async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger>Open settings</DialogTrigger>
        <DialogContent>
          <DialogTitle>Workspace settings</DialogTitle>
          <DialogDescription>Update your workspace preferences.</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open settings" }));

    expect(
      screen.getByRole("dialog", { name: "Workspace settings" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
