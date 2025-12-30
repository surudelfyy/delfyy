const encoder = new TextEncoder()

export function sendProgress(writer: WritableStreamDefaultWriter, step: string, message: string) {
  const data = JSON.stringify({ step, message })
  writer.write(encoder.encode(`event: progress\ndata: ${data}\n\n`))
}

export function sendResult(writer: WritableStreamDefaultWriter, data: any) {
  writer.write(encoder.encode(`event: result\ndata: ${JSON.stringify(data)}\n\n`))
}

export function sendError(writer: WritableStreamDefaultWriter, code: string, message: string) {
  const data = JSON.stringify({ code, message })
  writer.write(encoder.encode(`event: error\ndata: ${data}\n\n`))
}

export function sendHeartbeat(writer: WritableStreamDefaultWriter) {
  writer.write(encoder.encode(`: heartbeat\n\n`))
}

export function startHeartbeat(writer: WritableStreamDefaultWriter, intervalMs = 15000) {
  return setInterval(() => {
    try {
      sendHeartbeat(writer)
    } catch {
      // ignore heartbeat failures
    }
  }, intervalMs)
}

