const MIME_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
};

const base64ToBlob = (buffer, mimetype) => {
  const binary = window.atob(buffer);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimetype });
};

const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadExportResponse = (response, type, fallbackName) => {
  if (type === 'json') {
    const content = JSON.stringify(response?.data || [], null, 2);
    saveBlob(new Blob([content], { type: MIME_TYPES.json }), `${fallbackName}.json`);
    return;
  }

  const file = response?.data;
  if (!file?.buffer) {
    throw new Error('Dữ liệu tệp xuất không hợp lệ');
  }

  saveBlob(
    base64ToBlob(file.buffer, file.mimetype || MIME_TYPES[type]),
    file.filename || `${fallbackName}.${type}`
  );
};