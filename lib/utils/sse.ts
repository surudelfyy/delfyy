const encoder = new TextEncoder()

export async function safeWrite(writer: WritableStreamDefaultWriter, chunk: Uint8Array): Promise<boolean> {
  try {
    await writer.write(chunk)
    return true
  } catch {
    return false
  }
}

export function sendProgress(writer: WritableStreamDefaultWriter, step: string, message: string) {
  const data = JSON.stringify({ step, message })
  return safeWrite(writer, encoder.encode(`event: progress\ndata: ${data}\n\n`))
}

export function sendResult(writer: WritableStreamDefaultWriter, data: any) {
  return safeWrite(writer, encoder.encode(`event: result\ndata: ${JSON.stringify(data)}\n\n`))
}

export function sendError(writer: WritableStreamDefaultWriter, code: string, message: string) {
  const data = JSON.stringify({ code, message })
  return safeWrite(writer, encoder.encode(`event: error\ndata: ${data}\n\n`))
}

export function sendHeartbeat(writer: WritableStreamDefaultWriter) {
  return safeWrite(writer, encoder.encode(`: heartbeat\n\n`))
}

export function startHeartbeat(writer: WritableStreamDefaultWriter, intervalMs = 15000) {
  return setInterval(() => {
    void sendHeartbeat(writer)
  }, intervalMs)
}

