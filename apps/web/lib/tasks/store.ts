export interface TaskItem {
  id: string;
  content: string;
  isCompleted: boolean;
  showOnLockScreen: boolean;
  createdAt: string;
}

const taskItems: TaskItem[] = [];

export function listTaskItems() {
  return taskItems;
}

export function addTaskItem(content: string, showOnLockScreen = false) {
  const normalized = content.trim();
  if (!normalized) {
    throw new Error("할 일 내용을 입력해 주세요.");
  }

  const item: TaskItem = {
    id: `t_${Date.now()}`,
    content: normalized,
    isCompleted: false,
    showOnLockScreen,
    createdAt: new Date().toISOString(),
  };

  taskItems.unshift(item);
  return item;
}

export function updateTaskItemCompletion(id: string, isCompleted: boolean) {
  const item = taskItems.find((task) => task.id === id);
  if (!item) {
    throw new Error("해당 할 일을 찾을 수 없습니다.");
  }

  item.isCompleted = isCompleted;
  return item;
}