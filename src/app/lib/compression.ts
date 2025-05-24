export async function compress(content: object) {
  const streamReader = new Blob([JSON.stringify(content)])
    .stream()
    .pipeThrough(new CompressionStream('gzip'))
    .getReader()
  const chunks = []
  while (true) {
    const {done, value} = await streamReader.read()
    if (done) break
    chunks.push(value)
  }
  return new Blob(chunks)
}
export async function decompress(blob: Blob) {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
  const json = await new Response(stream).json()
  return json
}
