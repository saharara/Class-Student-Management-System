const normalizeKey = key => String(key);

export const getPinnedTablePage = ({
  records,
  selectedRowKeys,
  currentPage,
  pageSize,
}) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const selectedKeys = Array.isArray(selectedRowKeys) ? selectedRowKeys.map(normalizeKey) : [];
  const selectedKeySet = new Set(selectedKeys);
  const recordByKey = safeRecords.reduce((mapped, record) => {
    mapped[normalizeKey(record.key)] = record;
    return mapped;
  }, {});

  const pinnedRows = selectedKeys
    .map(key => recordByKey[key])
    .filter(Boolean);
  const normalizedPageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(safeRecords.length / normalizedPageSize));
  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * normalizedPageSize;
  const pageRecords = safeRecords.slice(startIndex, startIndex + normalizedPageSize);
  const pageRows = [
    ...pinnedRows,
    ...pageRecords.filter(record => !selectedKeySet.has(normalizeKey(record.key))),
  ];

  return {
    currentPage: safeCurrentPage,
    pageRows,
    pinnedCount: pinnedRows.length,
    totalCount: safeRecords.length,
    totalPages,
    paginationTotal: safeRecords.length,
  };
};