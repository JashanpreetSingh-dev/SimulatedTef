/**
 * AudioWorklet processor for microphone input (replaces deprecated ScriptProcessorNode).
 * Accumulates samples to match previous 2048-sample chunk size, then posts to main thread.
 */
const CHUNK_SIZE = 2048;

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(CHUNK_SIZE);
    this._index = 0;
  }

  process(inputs, _outputs, _parameters) {
    const input = inputs[0];
    if (!input || !input.length) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._index++] = channel[i];
      if (this._index >= CHUNK_SIZE) {
        const copy = new Float32Array(this._buffer);
        this.port.postMessage({ samples: copy }, [copy.buffer]);
        this._index = 0;
      }
    }
    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
