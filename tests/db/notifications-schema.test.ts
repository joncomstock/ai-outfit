import { notificationsTable } from "@/db/schema/notifications";
import { getTableName } from "drizzle-orm";

describe("Notifications schema", () => {
  it("notifications table has correct name", () => {
    expect(getTableName(notificationsTable)).toBe("notifications");
  });
});
