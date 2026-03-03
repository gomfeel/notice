export type IntakeStatus = "unread" | "read";

export interface IntakeItem {
  id: string;
  url: string;
  title: string;
  description: string;
  selectedFolder: string;
  confidence: number;
  status: IntakeStatus;
  createdAt: string;
}

const intakeItems: IntakeItem[] = [];

export function addIntakeItem(item: IntakeItem) {
  intakeItems.unshift(item);
  if (intakeItems.length > 30) {
    intakeItems.length = 30;
  }
}

export function listIntakeItems() {
  return intakeItems;
}

export function updateIntakeStatus(id: string, status: IntakeStatus) {
  const item = intakeItems.find((it) => it.id === id);
  if (!item) {
    throw new Error("\uB9C1\uD06C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }

  item.status = status;
  return item;
}