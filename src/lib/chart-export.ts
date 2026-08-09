/**
 * Captures a DOM element as a PNG data URL via html2canvas.
 * Used for embedding charts into PDF and DOCX exports.
 */
export async function captureElement(
  el: HTMLElement,
  scale = 2
): Promise<string> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#161B22',
    logging: false,
  });
  return canvas.toDataURL('image/png');
}

/**
 * Capture all elements with [data-chart-id] attribute.
 * Returns a map of chart ID → PNG data URL.
 */
export async function captureAllCharts(
  container: HTMLElement = document.body
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const elements = container.querySelectorAll<HTMLElement>('[data-chart-id]');

  for (const el of Array.from(elements)) {
    const id = el.getAttribute('data-chart-id');
    if (id) {
      try {
        const url = await captureElement(el);
        result.set(id, url);
      } catch (err) {
        console.warn(`Failed to capture chart "${id}":`, err);
      }
    }
  }

  return result;
}

/**
 * Convert SVG element to PNG data URL via canvas.
 */
export async function svgToPng(svgEl: SVGElement, scale = 2): Promise<string> {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
