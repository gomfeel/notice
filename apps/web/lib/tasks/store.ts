export interface TaskItem {
  id: string;
  content: string;
  isCompleted: boolean;
  showOnLockScreen: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const taskItems: TaskItem[] = [];

export function listTaskItems() {
  return taskItems;
}

export function getTaskItemById(id: string) {
  return taskItems.find((task) => task.id === id) ?? null;
}

export function addTaskItem(
  content: string,
  showOnLockScreen = false,
  startsAt: string | null = null,
  endsAt: string | null = null
) {
  const normalized = content.trim();
  if (!normalized) {
    throw new Error("\uD560 \uC77C \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  }

  const item: TaskItem = {
    id: `t_${Date.now()}`,
    content: normalized,
    isCompleted: false,
    showOnLockScreen,
    startsAt,
    endsAt,
    createdAt: new Date().toISOString(),
  };

  taskItems.unshift(item);
  return item;
}

export function updateTaskItemCompletion(id: string, isCompleted: boolean) {
  const item = taskItems.find((task) => task.id === id);
  if (!item) {
    throw new Error("\uD574\uB2F9 \uD560 \uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }

  item.isCompleted = isCompleted;
  return item;
}

export function updateTaskItemLockScreen(id: string, showOnLockScreen: boolean) {
  const item = taskItems.find((task) => task.id === id);
  if (!item) {
    throw new Error("\uD574\uB2F9 \uD560 \uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }

  item.showOnLockScreen = showOnLockScreen;
  return item;
}
