export interface IntakeItem {
  id: string;
  url: string;
  title: string;
  description: string;
  selectedFolder: string;
  confidence: number;
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