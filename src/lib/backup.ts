// JSON export/import — the portability backstop against browser storage
// loss. Pure browser file plumbing; the actual data round-trip lives in
// the repo layer (exportItems / importItems).

import type { BackupItem } from '@/repo'

export function downloadBackup(items: BackupItem[]) {
  const payload = JSON.stringify(
    { app: 'dresser', version: 1, exportedAt: new Date().toISOString(), items },
    null,
    2,
  )
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dresser-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function readBackupFile(file: File): Promise<BackupItem[]> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const items = Array.isArray(parsed) ? parsed : parsed.items
  if (!Array.isArray(items)) throw new Error('Not a Dresser backup file.')
  return items as BackupItem[]
}
