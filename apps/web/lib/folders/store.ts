export interface FolderItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

const folderItems: FolderItem[] = [
  { id: "f_stock", name: "주식", description: "투자 관련 링크", createdAt: new Date().toISOString() },
  { id: "f_travel", name: "여행", description: "여행 계획 및 정보", createdAt: new Date().toISOString() },
  { id: "f_work", name: "업무", description: "업무 및 프로젝트", createdAt: new Date().toISOString() },
];

export function listFolderItems() {
  return folderItems;
}

export function addFolderItem(name: string, description?: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("폴더 이름은 필수입니다.");
  }

  const exists = folderItems.some((item) => item.name === normalizedName);
  if (exists) {
    throw new Error("이미 존재하는 폴더입니다.");
  }

  const item: FolderItem = {
    id: `f_${Date.now()}`,
    name: normalizedName,
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  folderItems.unshift(item);
  return item;
}