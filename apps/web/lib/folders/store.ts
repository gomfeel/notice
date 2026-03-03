export interface FolderItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

const folderItems: FolderItem[] = [
  { id: "f_stock", name: "\uC8FC\uC2DD", description: "\uD22C\uC790 \uAD00\uB828 \uB9C1\uD06C", createdAt: new Date().toISOString() },
  { id: "f_travel", name: "\uC5EC\uD589", description: "\uC5EC\uD589 \uACC4\uD68D \uBC0F \uC815\uBCF4", createdAt: new Date().toISOString() },
  { id: "f_work", name: "\uC5C5\uBB34", description: "\uC5C5\uBB34 \uBC0F \uD504\uB85C\uC81D\uD2B8", createdAt: new Date().toISOString() },
];

export function listFolderItems() {
  return folderItems;
}

export function addFolderItem(name: string, description?: string) {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("\uD3F4\uB354 \uC774\uB984\uC740 \uD544\uC218\uC785\uB2C8\uB2E4.");
  }

  const exists = folderItems.some((item) => item.name === normalizedName);
  if (exists) {
    throw new Error("\uC774\uBBF8 \uC874\uC7AC\uD558\uB294 \uD3F4\uB354\uC785\uB2C8\uB2E4.");
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