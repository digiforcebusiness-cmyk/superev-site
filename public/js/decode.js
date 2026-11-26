// Decode an Ogg Vorbis file. Most browsers decode it natively; Safari may not,
// so fall back to a WebAssembly Vorbis decoder loaded only when needed.
const WASM_DECODER = 'https://cdn.jsdelivr.net/npm/@wasm-audio-decoders/ogg-vorbis@0.1.20/+esm';
let wasm = null;

export async function decodeOgg(ctx, arrayBuffer, loadFallback = () => import(WASM_DECODER)) {
  try {
    // decodeAudioData detaches its input, so keep a copy for the fallback.
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    wasm ??= loadFallback().then(async ({ OggVorbisDecoder }) => {
      const d = new OggVorbisDecoder();
      await d.ready;
      return d;
    });
    let decoder;
    try { decoder = await wasm; } catch (e) { wasm = null; throw e; }
    const { channelData, samplesDecoded, sampleRate } = await decoder.decodeFile(new Uint8Array(arrayBuffer));
    await decoder.reset?.();
    const buf = ctx.createBuffer(channelData.length, samplesDecoded, sampleRate);
    channelData.forEach((ch, i) => buf.copyToChannel(ch, i));
    return buf;
  }
}

/** Test hook: forget the cached fallback decoder. */
export function _resetFallback() { wasm = null; }
