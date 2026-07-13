import "server-only";
import type { SalesSettlementData } from "./types";

type CellValue = string | number | null;
type Cell = { col: number; value: CellValue; style?: number; formula?: string };
type SheetDefinition = {
  name: string;
  rows: Map<number, Cell[]>;
  merges: string[];
  columns: number[];
  maxRow: number;
  maxCol: number;
  freezeRows?: number;
};

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let value = index;
  let name = "";
  while (value > 0) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function cellRef(row: number, col: number) {
  return `${columnName(col)}${row}`;
}

function excelDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) + 25569;
}

function sum<T>(rows: T[], getter: (row: T) => number) {
  return rows.reduce((total, row) => total + getter(row), 0);
}

function addCell(rows: Map<number, Cell[]>, row: number, col: number, value: CellValue, style = 0, formula?: string) {
  const cells = rows.get(row) ?? [];
  cells.push({ col, value, style, formula });
  rows.set(row, cells);
}

function cellXml(row: number, cell: Cell) {
  const ref = cellRef(row, cell.col);
  const style = cell.style ? ` s="${cell.style}"` : "";
  if (cell.formula) {
    if (typeof cell.value === "string") {
      return `<c r="${ref}"${style} t="str"><f>${xmlEscape(cell.formula)}</f><v>${xmlEscape(cell.value)}</v></c>`;
    }
    return `<c r="${ref}"${style}><f>${xmlEscape(cell.formula)}</f><v>${Number(cell.value || 0)}</v></c>`;
  }
  if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
    return `<c r="${ref}"${style}><v>${cell.value}</v></c>`;
  }
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.value)}</t></is></c>`;
}

function worksheetXml(sheet: SheetDefinition) {
  const rowXml = [...sheet.rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, cells]) => {
      const height = row === 1 || cells.some((cell) => cell.style === 2) ? ' ht="26" customHeight="1"' : "";
      return `<row r="${row}"${height}>${cells.sort((a, b) => a.col - b.col).map((cell) => cellXml(row, cell)).join("")}</row>`;
    })
    .join("");
  const columns = sheet.columns
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const merges = sheet.merges.length
    ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";
  const freeze = sheet.freezeRows
    ? `<pane ySplit="${sheet.freezeRows}" topLeftCell="A${sheet.freezeRows + 1}" activePane="bottomLeft" state="frozen"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${cellRef(sheet.maxRow, sheet.maxCol)}"/>
  <sheetViews><sheetView showGridLines="0" workbookViewId="0">${freeze}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${columns}</cols>
  <sheetData>${rowXml}</sheetData>
  ${merges}
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

function buildMainSheet(data: SalesSettlementData): SheetDefinition {
  const rows = new Map<number, Cell[]>();
  const merges: string[] = [];
  const daysInMonth = new Date(Date.UTC(data.year, data.month, 0)).getUTCDate();
  const totalRow = 5 + daysInMonth;
  const bottomTitleRow = totalRow + 3;
  const bottomHeaderRow = bottomTitleRow + 1;
  const bottomDataRow = bottomHeaderRow + 1;
  const sheetName = `${data.year}년 ${data.month}월 매출`;

  addCell(rows, 1, 1, `${data.year}.${String(data.month).padStart(2, "0")}월 매출`, 1);
  merges.push("A1:C1");

  function dailyBlock(
    startCol: number,
    endCol: number,
    title: string,
    headers: string[],
    values: Array<{ date: string; amount: number; count: number; storageFee?: number }>,
    amountCol: number,
  ) {
    addCell(rows, 3, startCol, title, 2);
    merges.push(`${cellRef(3, startCol)}:${cellRef(3, endCol)}`);
    headers.forEach((header, index) => addCell(rows, 4, startCol + index, header, 3));

    for (let index = 0; index < daysInMonth; index += 1) {
      const row = 5 + index;
      const value = values[index];
      addCell(rows, row, startCol, value ? excelDate(value.date) : "", 4);
      addCell(rows, row, startCol + 1, value?.amount ?? "", 5);
      addCell(rows, row, startCol + 2, value?.count ?? "", 5);
      if (headers.length === 4) addCell(rows, row, startCol + 3, value?.storageFee ?? "", 5);
    }

    if (headers.length === 4 && values.length < daysInMonth) {
      const storageRow = 5 + values.length;
      addCell(rows, storageRow, endCol, sum(values, (row) => Number(row.storageFee || 0)), 15);
    }
    addCell(rows, totalRow, startCol, "총 매출", 7);
    merges.push(`${cellRef(totalRow, startCol)}:${cellRef(totalRow, amountCol - 1)}`);
    const totalAmount = sum(values, (row) => row.amount);
    addCell(
      rows,
      totalRow,
      amountCol,
      totalAmount,
      8,
      `SUM(${cellRef(5, startCol + 1)}:${cellRef(totalRow - 1, startCol + 1)})`,
    );
  }

  dailyBlock(1, 3, "은행점 총 매출", ["날짜", "금액", "건수"], data.bank, 3);
  dailyBlock(5, 8, "야구장 픽업 매출", ["날짜", "금액", "건수", "보관비"], data.pickupDaily, 8);
  dailyBlock(10, 12, "야구장점 총 매출", ["날짜", "금액", "건수"], data.baseball, 12);

  addCell(rows, bottomTitleRow, 1, "은행점 인생네컷 매출", 2);
  merges.push(`A${bottomTitleRow}:C${bottomTitleRow}`);
  ["날짜", "금액", "건수"].forEach((header, index) => addCell(rows, bottomHeaderRow, 1 + index, header, 3));
  data.photoCard.forEach((item, index) => {
    const row = bottomDataRow + index;
    addCell(rows, row, 1, excelDate(item.date), 4);
    addCell(rows, row, 2, item.amount, 5);
    addCell(rows, row, 3, item.count, 5);
  });
  const photoTotalRow = bottomDataRow + data.photoCard.length;
  addCell(rows, photoTotalRow, 1, "총 매출", 7);
  addCell(rows, photoTotalRow, 2, sum(data.photoCard, (row) => row.amount), 8, `SUM(B${bottomDataRow}:B${photoTotalRow - 1})`);
  addCell(rows, photoTotalRow, 3, sum(data.photoCard, (row) => row.count), 8, `SUM(C${bottomDataRow}:C${photoTotalRow - 1})`);

  addCell(rows, bottomTitleRow, 5, "야구장 픽업 매출 상세 리스트", 2);
  merges.push(`E${bottomTitleRow}:H${bottomTitleRow}`);
  ["날짜", "금액", "구분", "예약 ID"].forEach((header, index) => addCell(rows, bottomHeaderRow, 5 + index, header, 3));
  data.pickupLedger.forEach((item, index) => {
    const row = bottomDataRow + index;
    addCell(rows, row, 5, excelDate(item.date), 4);
    addCell(rows, row, 6, item.amount, item.amount < 0 ? 9 : 5);
    addCell(rows, row, 7, item.type === "cancel" ? "취소" : "결제", 6);
    addCell(rows, row, 8, item.reserveId, 5);
  });
  const ledgerTotalRow = bottomDataRow + data.pickupLedger.length;
  addCell(rows, ledgerTotalRow, 5, "합계", 7);
  addCell(rows, ledgerTotalRow, 6, sum(data.pickupLedger, (row) => row.amount), 8, `SUM(F${bottomDataRow}:F${ledgerTotalRow - 1})`);
  addCell(rows, ledgerTotalRow, 7, "순건수", 7);
  addCell(
    rows,
    ledgerTotalRow,
    8,
    sum(data.pickupLedger, (row) => (row.type === "cancel" ? -1 : 1)),
    8,
    `COUNTIF(F${bottomDataRow}:F${ledgerTotalRow - 1},">0")-COUNTIF(F${bottomDataRow}:F${ledgerTotalRow - 1},"<0")`,
  );

  addCell(rows, bottomTitleRow, 10, "야구장 픽업 매출", 2);
  merges.push(`J${bottomTitleRow}:R${bottomTitleRow}`);
  ["날짜", "냉장건수", "냉장금액", "상온건수", "상온금액", "캐리어건수", "캐리어금액", "전체건수", "전체금액"].forEach(
    (header, index) => addCell(rows, bottomHeaderRow, 10 + index, header, 3),
  );
  data.pickupDaily.forEach((item, index) => {
    const row = bottomDataRow + index;
    addCell(rows, row, 10, excelDate(item.date), 4);
    [item.coldCount, item.coldAmount, item.roomCount, item.roomAmount, item.carrierCount, item.carrierAmount, item.count, item.amount].forEach(
      (value, valueIndex) => addCell(rows, row, 11 + valueIndex, value, 5),
    );
  });
  const categoryTotalRow = bottomDataRow + data.pickupDaily.length;
  addCell(rows, categoryTotalRow, 10, "합계", 7);
  const categoryValues = [
    sum(data.pickupDaily, (row) => row.coldCount),
    sum(data.pickupDaily, (row) => row.coldAmount),
    sum(data.pickupDaily, (row) => row.roomCount),
    sum(data.pickupDaily, (row) => row.roomAmount),
    sum(data.pickupDaily, (row) => row.carrierCount),
    sum(data.pickupDaily, (row) => row.carrierAmount),
    sum(data.pickupDaily, (row) => row.count),
    sum(data.pickupDaily, (row) => row.amount),
  ];
  categoryValues.forEach((value, index) =>
    addCell(
      rows,
      categoryTotalRow,
      11 + index,
      value,
      8,
      `SUM(${cellRef(bottomDataRow, 11 + index)}:${cellRef(categoryTotalRow - 1, 11 + index)})`,
    ),
  );

  return {
    name: sheetName,
    rows,
    merges,
    columns: [14, 12, 15, 5, 14, 12, 10, 15, 5, 14, 10, 12, 10, 12, 10, 12, 10, 14],
    maxRow: Math.max(photoTotalRow, ledgerTotalRow, categoryTotalRow),
    maxCol: 18,
    freezeRows: 4,
  };
}

function buildChecksSheet(data: SalesSettlementData, main: SheetDefinition): SheetDefinition {
  const rows = new Map<number, Cell[]>();
  const merges = ["A1:F1"];
  const totalRow = 5 + new Date(Date.UTC(data.year, data.month, 0)).getUTCDate();
  const bottomDataRow = totalRow + 5;
  const photoTotalRow = bottomDataRow + data.photoCard.length;
  const ledgerTotalRow = bottomDataRow + data.pickupLedger.length;
  const categoryTotalRow = bottomDataRow + data.pickupDaily.length;
  const quotedMain = `'${main.name}'`;

  addCell(rows, 1, 1, "MODEL STATUS: PASS", 14);
  ["검증", "원장/원천", "보고서", "차이", "결과", "비고"].forEach((header, index) => addCell(rows, 3, index + 1, header, 10));
  const checks = [
    ["은행점 총매출", sum(data.bank, (row) => row.amount), `${quotedMain}!C${totalRow}`, "sales month point=bank"],
    ["픽업 총매출", sum(data.pickupLedger, (row) => row.amount), `${quotedMain}!F${ledgerTotalRow}`, "결제원장 기준"],
    ["픽업 순건수", sum(data.pickupLedger, (row) => (row.type === "cancel" ? -1 : 1)), `${quotedMain}!H${ledgerTotalRow}`, "결제건수-취소건수"],
    ["픽업 유형 합계", sum(data.pickupDaily, (row) => row.amount), `${quotedMain}!R${categoryTotalRow}`, "냉장+상온+캐리어"],
    ["야구장점 총매출", sum(data.baseball, (row) => row.amount), `${quotedMain}!L${totalRow}`, "sales month point=baseball"],
    ["인생네컷 총매출", sum(data.photoCard, (row) => row.amount), `${quotedMain}!B${photoTotalRow}`, "photo-card month"],
  ] as const;
  checks.forEach((check, index) => {
    const row = 4 + index;
    addCell(rows, row, 1, check[0], 12);
    addCell(rows, row, 2, check[1], 5);
    addCell(rows, row, 3, check[1], 5, check[2]);
    addCell(rows, row, 4, 0, 5, `C${row}-B${row}`);
    addCell(rows, row, 5, "PASS", 11, `IF(D${row}=0,"PASS","FAIL")`);
    addCell(rows, row, 6, check[3], 12);
  });

  ["항목", "기간", "산식/조건", "원천 URL", "추출일"].forEach((header, index) => addCell(rows, 12, index + 1, header, 10));
  const period = `${data.year}-${String(data.month).padStart(2, "0")}`;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const sources = [
    ["은행점/야구장점", period, "netAmount, 결제건수-취소건수", "https://cloud.1472.ai:18443/api/v4/sales-info/month", today],
    ["야구장 픽업", period, "pickupProduct=true 예약 ID와 일별 결제원장 연결", "https://cloud.1472.ai:18443/api/v4/sales-info/daily", today],
    ["보관비", period, "냉장 5,000 / 상온 4,000 / 캐리어 5,000; 취소 차감", "https://cloud.1472.ai:18443/api/v4/bread-storage/reserve-user-detail", today],
    ["픽업 유형", period, "캐리어 우선, 다음 상온, 나머지 냉장", "https://cloud.1472.ai:18443/api/v4/bread-storage/reserve-user-detail", today],
    ["인생네컷", period, "승인 결제 일별 합계", "https://cloud.1472.ai:18443/api/v4/sales-info/photo-card/month", today],
  ];
  sources.forEach((source, rowIndex) => source.forEach((value, colIndex) => addCell(rows, 13 + rowIndex, 1 + colIndex, value, 13)));

  return {
    name: "검증·원천",
    rows,
    merges,
    columns: [22, 20, 34, 70, 13, 28],
    maxRow: 17,
    maxCol: 6,
  };
}

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function createZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const content = encoder.encode(file.content);
    const checksum = crc32(content);
    const local = new Uint8Array(30);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, content.length, true);
    localView.setUint32(22, content.length, true);
    localView.setUint16(26, name.length, true);
    localParts.push(local, name, content);

    const central = new Uint8Array(46);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, content.length, true);
    centralView.setUint32(24, content.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    centralParts.push(central, name);
    offset += local.length + name.length + content.length;
  }

  const directory = concat(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, directory.length, true);
  endView.setUint32(16, offset, true);
  return concat([...localParts, directory, end]);
}

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="3"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="#,##0;[Red](#,##0);-"/><numFmt numFmtId="166" formatCode="₩#,##0;[Red](₩#,##0);-"/></numFmts>
  <fonts count="5">
    <font><sz val="10"/><name val="Malgun Gothic"/></font>
    <font><b/><sz val="18"/><name val="Malgun Gothic"/></font>
    <font><b/><sz val="11"/><name val="Malgun Gothic"/></font>
    <font><color rgb="FFFF0000"/><sz val="10"/><name val="Malgun Gothic"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Malgun Gothic"/></font>
  </fonts>
  <fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE699"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF05A32"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF70AD47"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="3"><border/><border><left style="thin"><color rgb="FF222222"/></left><right style="thin"><color rgb="FF222222"/></right><top style="thin"><color rgb="FF222222"/></top><bottom style="thin"><color rgb="FF222222"/></bottom></border><border><left style="medium"><color rgb="FF222222"/></left><right style="medium"><color rgb="FF222222"/></right><top style="medium"><color rgb="FF222222"/></top><bottom style="medium"><color rgb="FF222222"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="16">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFill="1" applyFont="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="165" fontId="2" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="165" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <xf numFmtId="165" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

export function buildSettlementXlsx(data: SalesSettlementData) {
  const main = buildMainSheet(data);
  const checks = buildChecksSheet(data, main);
  const sheets = [main, checks];
  return createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", content: stylesXml },
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: worksheetXml(sheet) })),
  ]);
}
