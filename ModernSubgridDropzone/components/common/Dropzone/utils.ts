export function getFileExtension(filename?: string): string {
  if (!filename) return "folder";
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext || "txt";
}

