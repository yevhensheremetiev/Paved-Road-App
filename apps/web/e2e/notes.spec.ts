import { expect, test, type Page } from "@playwright/test";

type Note = {
  content: string | null;
  id: string;
  title: string;
  urgency: NoteUrgency;
};

type NoteUrgency = "URGENT" | "CAN_WAIT" | "ANYTIME";

const apiUrlPattern = "**/api/**";
const authHeader = "Bearer e2e-token";

async function mockNotesApi(page: Page, notes: Note[] = []) {
  let currentNotes = [...notes];

  await page.route(apiUrlPattern, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    expect(request.headers().authorization).toBe(authHeader);

    if (url.pathname === "/api/me" && request.method() === "GET") {
      await route.fulfill({
        json: {
          user: {
            cognitoSub: "e2e-user",
            id: "user-1"
          }
        }
      });
      return;
    }

    if (url.pathname === "/api/notes" && request.method() === "GET") {
      await route.fulfill({
        json: {
          notes: currentNotes
        }
      });
      return;
    }

    if (url.pathname === "/api/notes" && request.method() === "POST") {
      const input = (await request.postDataJSON()) as {
        content: string;
        title: string;
        urgency: NoteUrgency;
      };
      const note = {
        content: input.content,
        id: `note-${currentNotes.length + 1}`,
        title: input.title,
        urgency: input.urgency
      };

      currentNotes = [note, ...currentNotes];

      await route.fulfill({
        json: {
          note
        },
        status: 201
      });
      return;
    }

    if (url.pathname.startsWith("/api/notes/") && request.method() === "DELETE") {
      const noteId = url.pathname.split("/").at(-1);
      currentNotes = currentNotes.filter((note) => note.id !== noteId);

      await route.fulfill({
        status: 204
      });
      return;
    }

    await route.fulfill({
      json: {
        message: "Unhandled e2e API request"
      },
      status: 404
    });
  });
}

test("shows the guest sign-in screen", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("paved-road-e2e-auth-state", "unauthenticated");
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Paved Road App" })).toBeVisible();
  await expect(page.getByText("Sign in to open your notes.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("shows an authenticated empty notes workspace", async ({ page }) => {
  await mockNotesApi(page);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "My Notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E User" })).toBeVisible();
  await expect(page.getByText("e2e@example.com")).toBeVisible();
  await expect(page.getByText("0 notes")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
});

test("creates and deletes a note", async ({ page }) => {
  await mockNotesApi(page);

  await page.goto("/");

  await page.getByLabel("Title").fill("Daily plan");
  await page.getByLabel("Content").fill("Ship the Playwright coverage");
  await page.getByLabel("Urgency").selectOption("URGENT");
  await page.getByRole("button", { name: "Add note" }).click();

  const note = page.getByRole("listitem").filter({ hasText: "Daily plan" });

  await expect(note.getByRole("heading", { name: "Daily plan" })).toBeVisible();
  await expect(note.getByText("Urgent")).toBeVisible();
  await expect(note.getByText("Ship the Playwright coverage")).toBeVisible();
  await expect(page.getByText("1 note")).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("heading", { name: "Daily plan" })).toBeHidden();
  await expect(page.getByText("0 notes")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nothing here yet" })).toBeVisible();
});
