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
    throw new Error("링크를 찾을 수 없습니다.");
  }

  item.status = status;
  return item;
}