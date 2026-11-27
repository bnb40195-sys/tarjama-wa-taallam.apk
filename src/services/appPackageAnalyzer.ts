import JSZip from 'jszip';
import {
  SupportedFormat,
  TranslatableEntry,
  parseDocumentForTranslation,
} from './appFileTranslator.ts';

export type AppArchiveKind = 'android-apk' | 'android-aab' | 'ios-ipa' | 'app-zip';

export interface ExtractedLanguageFile {
  id: string;
  path: string;
  fileName: string;
  format: SupportedFormat;
  detectedLangHint: string;
  sourceKind: 'plain-text' | 'compiled-arsc';
  content: string;
  entryCount: number;
  previewEntries: TranslatableEntry[];
}

export interface SkippedBreakdown {
  codeAndBinaries: number;
  mediaAndAssets: number;
  configAndOther: number;
}

export interface AppAnalysisResult {
  appFileName: string;
  appSizeBytes: number;
  appKind: AppArchiveKind;
  appName: string;
  packageId: string;
  totalFilesCount: number;
  skippedFilesCount: number;
  skippedBreakdown: SkippedBreakdown;
  extractedLanguageFiles: ExtractedLanguageFile[];
  usedBinaryArsc: boolean;
}

export interface TranslatedLanguageFileBundle {
  originalPath: string;
  outputFileName: string;
  outputPath: string;
  format: SupportedFormat;
  content: string;
  translatedCount: number;
}

const MAX_APP_ARCHIVE_BYTES = 150 * 1024 * 1024; // 150 MB

const IGNORED_JSON_NAMES = new Set([
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'jsconfig.json',
  'manifest.json',
  'capacitor.config.json',
  'angular.json',
  'metadata.json',
  'firebase.json',
  'google-services.json',
  'composer.json',
  'app.json',
  'eas.json',
  'expo.json',
  'assetmanifest.json',
  'fontmanifest.json',
  'build-info.json',
  'output-metadata.json',
  'dex-renamer-state.json',
]);

const KNOWN_LANG_CODES = new Set([
  'ar', 'en', 'fr', 'es', 'de', 'tr', 'it', 'ru', 'zh', 'ja', 'ko', 'pt',
  'hi', 'id', 'ms', 'nl', 'pl', 'uk', 'fa', 'ur', 'he', 'vi', 'th', 'sv',
  'en-us', 'en-gb', 'ar-sa', 'ar-eg', 'zh-cn', 'zh-tw', 'pt-br', 'es-mx',
  'en_us', 'en_gb', 'ar_sa', 'zh_cn', 'pt_br',
]);

function escapeXmlValue(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlAttr(str: string): string {
  return escapeXmlValue(str).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function isBinaryBuffer(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // Compiled Android AXML / resource chunk starts with 0x0003 0x0008 or 0x0002
  if (bytes[0] === 0x03 && bytes[1] === 0x00 && bytes[2] === 0x08 && bytes[3] === 0x00) {
    return true;
  }
  // Apple binary plist
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x62 &&
    bytes[1] === 0x70 &&
    bytes[2] === 0x6c &&
    bytes[3] === 0x69 &&
    bytes[4] === 0x73 &&
    bytes[5] === 0x74
  ) {
    return true;
  }
  // Check for NUL bytes when NOT UTF-16 BOM
  const hasUtf16LeBom = bytes[0] === 0xff && bytes[1] === 0xfe;
  const hasUtf16BeBom = bytes[0] === 0xfe && bytes[1] === 0xff;
  if (hasUtf16LeBom || hasUtf16BeBom) return false;

  const checkLen = Math.min(bytes.length, 512);
  let nulCount = 0;
  for (let i = 0; i < checkLen; i++) {
    if (bytes[i] === 0) nulCount++;
  }
  return nulCount > 4;
}

function decodeTextBytes(bytes: Uint8Array): string {
  if (bytes.length >= 2) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2));
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    }
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3));
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

function readUtf8Length(bytes: Uint8Array, pos: number): { len: number; nextPos: number } {
  if (pos >= bytes.length) return { len: 0, nextPos: pos };
  const first = bytes[pos];
  if ((first & 0x80) === 0) {
    return { len: first, nextPos: pos + 1 };
  }
  if (pos + 1 >= bytes.length) return { len: first & 0x7f, nextPos: pos + 1 };
  return { len: ((first & 0x7f) << 8) | bytes[pos + 1], nextPos: pos + 2 };
}

function readStringPool(bytes: Uint8Array, dv: DataView, chunkStart: number): {
  strings: string[];
  chunkSize: number;
} {
  if (chunkStart + 28 > bytes.length) return { strings: [], chunkSize: 0 };
  const chunkType = dv.getUint16(chunkStart, true);
  if (chunkType !== 0x0001) return { strings: [], chunkSize: 0 };

  const headerSize = dv.getUint16(chunkStart + 2, true);
  const chunkSize = dv.getUint32(chunkStart + 4, true);
  const stringCount = dv.getUint32(chunkStart + 8, true);
  const flags = dv.getUint32(chunkStart + 16, true);
  const stringsStart = dv.getUint32(chunkStart + 20, true);

  const isUtf8 = (flags & 0x0100) !== 0;
  const offsetsBase = chunkStart + headerSize;
  const dataBase = chunkStart + stringsStart;
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
  const utf16Decoder = new TextDecoder('utf-16le', { fatal: false });

  const strings: string[] = [];
  const maxEnd = Math.min(bytes.length, chunkStart + chunkSize);

  for (let i = 0; i < stringCount; i++) {
    const offPos = offsetsBase + i * 4;
    if (offPos + 4 > maxEnd) {
      strings.push('');
      continue;
    }
    const relOff = dv.getUint32(offPos, true);
    let strPos = dataBase + relOff;
    if (strPos >= maxEnd) {
      strings.push('');
      continue;
    }

    if (isUtf8) {
      // Skip UTF-16 char count, read UTF-8 byte length
      const cLen = readUtf8Length(bytes, strPos);
      const bLen = readUtf8Length(bytes, cLen.nextPos);
      const start = bLen.nextPos;
      const end = Math.min(maxEnd, start + bLen.len);
      strings.push(utf8Decoder.decode(bytes.subarray(start, end)));
    } else {
      if (strPos + 2 > maxEnd) {
        strings.push('');
        continue;
      }
      let charLen = dv.getUint16(strPos, true);
      strPos += 2;
      if ((charLen & 0x8000) !== 0 && strPos + 2 <= maxEnd) {
        const low = dv.getUint16(strPos, true);
        strPos += 2;
        charLen = ((charLen & 0x7fff) << 16) | low;
      }
      const byteLen = charLen * 2;
      const end = Math.min(maxEnd, strPos + byteLen);
      strings.push(utf16Decoder.decode(bytes.subarray(strPos, end)));
    }
  }

  return { strings, chunkSize };
}

function decodeConfigLocale(bytes: Uint8Array, configStart: number): {
  folderName: string;
  langHint: string;
} {
  if (configStart + 12 > bytes.length) {
    return { folderName: 'values', langHint: 'default' };
  }
  const b0 = bytes[configStart + 8];
  const b1 = bytes[configStart + 9];
  const c0 = bytes[configStart + 10];
  const c1 = bytes[configStart + 11];

  let lang = '';
  if (b0 !== 0 || b1 !== 0) {
    if ((b0 & 0x80) !== 0) {
      // Packed 3-letter ISO 639-2 code in Android ResTable_config
      const ch2 = (b0 & 0x1f) + 97;
      const ch1 = (((b0 & 0xe0) >> 5) | ((b1 & 0x03) << 3)) + 97;
      const ch0 = ((b1 & 0x7c) >> 2) + 97;
      lang = String.fromCharCode(ch0, ch1, ch2);
    } else if (b0 >= 0x61 && b0 <= 0x7a && b1 >= 0x61 && b1 <= 0x7a) {
      lang = String.fromCharCode(b0, b1);
    }
  }

  let country = '';
  if (c0 !== 0 || c1 !== 0) {
    if ((c0 & 0x80) === 0 && c0 >= 0x41 && c0 <= 0x5a && c1 >= 0x41 && c1 <= 0x5a) {
      country = String.fromCharCode(c0, c1);
    } else if ((c0 & 0x80) === 0 && c0 >= 0x30 && c0 <= 0x39) {
      country = String.fromCharCode(c0, c1);
    }
  }

  if (!lang) return { folderName: 'values', langHint: 'default' };
  if (country) return { folderName: `values-${lang}-r${country}`, langHint: `${lang}-${country}` };
  return { folderName: `values-${lang}`, langHint: lang };
}

interface ParsedArscResult {
  packageName: string;
  files: Array<{
    path: string;
    langHint: string;
    xmlContent: string;
  }>;
}

/**
 * Pure TypeScript Android resources.arsc binary parser.
 * Extracts ONLY string resources into clean <resources><string name="...">...</string></resources> XMLs.
 */
function parseResourcesArsc(bytes: Uint8Array): ParsedArscResult | null {
  if (bytes.length < 16) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const rootType = dv.getUint16(0, true);
  if (rootType !== 0x0002) return null; // Not RES_TABLE_TYPE
  const rootHeaderSize = dv.getUint16(2, true);
  const rootSize = dv.getUint32(4, true);
  const limit = Math.min(bytes.length, rootSize || bytes.length);

  let cursor = rootHeaderSize;
  let globalStrings: string[] = [];
  let detectedPackageName = '';
  const buckets = new Map<string, { langHint: string; items: Map<string, string> }>();

  while (cursor + 8 <= limit) {
    const chunkType = dv.getUint16(cursor, true);
    const chunkHeaderSize = dv.getUint16(cursor + 2, true);
    const chunkSize = dv.getUint32(cursor + 4, true);
    if (chunkSize < 8 || cursor + chunkSize > limit) break;

    if (chunkType === 0x0001 && globalStrings.length === 0) {
      const pool = readStringPool(bytes, dv, cursor);
      globalStrings = pool.strings;
    } else if (chunkType === 0x0200) {
      // RES_TABLE_PACKAGE_TYPE
      if (cursor + 284 <= cursor + chunkSize) {
        const nameBytes = bytes.subarray(cursor + 12, cursor + 268);
        const decodedPkg = new TextDecoder('utf-16le').decode(nameBytes).replace(/\0.*$/, '').trim();
        if (decodedPkg && !detectedPackageName) detectedPackageName = decodedPkg;

        const typeStringsRel = dv.getUint32(cursor + 268, true);
        const keyStringsRel = dv.getUint32(cursor + 276, true);
        const typeStrings = typeStringsRel > 0 ? readStringPool(bytes, dv, cursor + typeStringsRel).strings : [];
        const keyStrings = keyStringsRel > 0 ? readStringPool(bytes, dv, cursor + keyStringsRel).strings : [];

        let pkgCursor = cursor + chunkHeaderSize;
        const pkgLimit = cursor + chunkSize;

        while (pkgCursor + 8 <= pkgLimit) {
          const subType = dv.getUint16(pkgCursor, true);
          const subHeaderSize = dv.getUint16(pkgCursor + 2, true);
          const subSize = dv.getUint32(pkgCursor + 4, true);
          if (subSize < 8 || pkgCursor + subSize > pkgLimit) break;

          if (subType === 0x0201) {
            // RES_TABLE_TYPE_TYPE
            const typeId = bytes[pkgCursor + 8];
            const typeName = typeStrings[typeId - 1] || '';

            if (typeName === 'string') {
              const typeFlags = bytes[pkgCursor + 9];
              const isSparse = (typeFlags & 0x01) !== 0;
              const isOffset16 = (typeFlags & 0x02) !== 0;
              const entryCount = dv.getUint32(pkgCursor + 12, true);
              const entriesStart = dv.getUint32(pkgCursor + 16, true);
              const { folderName, langHint } = decodeConfigLocale(bytes, pkgCursor + 20);

              let bucket = buckets.get(folderName);
              if (!bucket) {
                bucket = { langHint, items: new Map<string, string>() };
                buckets.set(folderName, bucket);
              }

              const offsetsStart = pkgCursor + subHeaderSize;
              const entriesAbsBase = pkgCursor + entriesStart;
              const typeLimit = pkgCursor + subSize;

              for (let i = 0; i < entryCount; i++) {
                let relOffset = 0xffffffff;
                if (isSparse) {
                  const p = offsetsStart + i * 4;
                  if (p + 4 > typeLimit) break;
                  const off16 = dv.getUint16(p + 2, true);
                  if (off16 !== 0xffff) relOffset = off16 * 4;
                } else if (isOffset16) {
                  const p = offsetsStart + i * 2;
                  if (p + 2 > typeLimit) break;
                  const off16 = dv.getUint16(p, true);
                  if (off16 !== 0xffff) relOffset = off16 * 4;
                } else {
                  const p = offsetsStart + i * 4;
                  if (p + 4 > typeLimit) break;
                  relOffset = dv.getUint32(p, true);
                }

                if (relOffset === 0xffffffff) continue;
                const entryPos = entriesAbsBase + relOffset;
                if (entryPos + 8 > typeLimit) continue;

                const entryFlags = dv.getUint16(entryPos + 2, true);
                const isCompact = (entryFlags & 0x0008) !== 0;
                const isComplex = (entryFlags & 0x0001) !== 0;

                if (isCompact) {
                  const keyIdx = dv.getUint16(entryPos, true);
                  const dataType = (entryFlags >> 8) & 0xff;
                  const dataVal = dv.getUint32(entryPos + 4, true);
                  if (dataType === 0x03 && keyIdx < keyStrings.length && dataVal < globalStrings.length) {
                    const keyName = keyStrings[keyIdx];
                    const strVal = globalStrings[dataVal];
                    if (keyName && strVal && !/^res\//i.test(strVal) && !bucket.items.has(keyName)) {
                      bucket.items.set(keyName, strVal);
                    }
                  }
                } else if (!isComplex) {
                  const entrySize = dv.getUint16(entryPos, true);
                  const keyIdx = dv.getUint32(entryPos + 4, true);
                  const valPos = entryPos + entrySize;
                  if (valPos + 8 <= typeLimit) {
                    const dataType = bytes[valPos + 3];
                    const dataVal = dv.getUint32(valPos + 4, true);
                    if (dataType === 0x03 && keyIdx < keyStrings.length && dataVal < globalStrings.length) {
                      const keyName = keyStrings[keyIdx];
                      const strVal = globalStrings[dataVal];
                      if (keyName && strVal && !/^res\//i.test(strVal) && !bucket.items.has(keyName)) {
                        bucket.items.set(keyName, strVal);
                      }
                    }
                  }
                }
              }
            }
          }

          pkgCursor += subSize;
        }
      }
    }

    cursor += chunkSize;
  }

  const files: ParsedArscResult['files'] = [];
  for (const [folderName, bucket] of buckets.entries()) {
    if (bucket.items.size === 0) continue;
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<resources>',
    ];
    for (const [k, v] of bucket.items.entries()) {
      lines.push(`    <string name="${escapeXmlAttr(k)}">${escapeXmlValue(v)}</string>`);
    }
    lines.push('</resources>');
    files.push({
      path: `res/${folderName}/strings.xml`,
      langHint: bucket.langHint,
      xmlContent: lines.join('\n'),
    });
  }

  // Sort default values/strings.xml first, then English, Arabic, others
  files.sort((a, b) => {
    if (a.path === 'res/values/strings.xml') return -1;
    if (b.path === 'res/values/strings.xml') return 1;
    if (a.langHint === 'en') return -1;
    if (b.langHint === 'en') return 1;
    return a.path.localeCompare(b.path);
  });

  return {
    packageName: detectedPackageName,
    files,
  };
}

function classifyAppKind(fileName: string, entryPaths: string[]): AppArchiveKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.apk')) return 'android-apk';
  if (lower.endsWith('.aab')) return 'android-aab';
  if (lower.endsWith('.ipa')) return 'ios-ipa';
  if (entryPaths.some((p) => p === 'AndroidManifest.xml' || p === 'resources.arsc' || p === 'classes.dex')) {
    return 'android-apk';
  }
  if (entryPaths.some((p) => p.startsWith('Payload/') && p.includes('.app/'))) {
    return 'ios-ipa';
  }
  if (entryPaths.some((p) => p.startsWith('base/manifest/AndroidManifest.xml'))) {
    return 'android-aab';
  }
  return 'app-zip';
}

function isLanguageFileCandidate(path: string): { match: boolean; formatHint?: SupportedFormat } {
  const normalized = path.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();
  const baseName = lower.split('/').pop() || '';
  const dirParts = lower.split('/').slice(0, -1);

  if (
    lower.includes('node_modules/') ||
    lower.includes('/.git/') ||
    lower.includes('/meta-inf/') ||
    lower.startsWith('meta-inf/')
  ) {
    return { match: false };
  }

  // Android strings XML
  if (
    baseName === 'strings.xml' ||
    (/^strings_[a-z0-9_-]+\.xml$/.test(baseName)) ||
    (dirParts.some((d) => d === 'values' || /^values-[a-z]{2}/.test(d)) && baseName.endsWith('.xml'))
  ) {
    return { match: true, formatHint: 'xml' };
  }

  // Flutter ARB
  if (baseName.endsWith('.arb')) {
    return { match: true, formatHint: 'arb' };
  }

  // iOS .strings (inside .lproj or standalone)
  if (baseName.endsWith('.strings')) {
    return { match: true, formatHint: 'strings' };
  }

  // Localization .properties
  if (
    baseName.endsWith('.properties') &&
    (baseName.includes('string') ||
      baseName.includes('message') ||
      baseName.includes('lang') ||
      baseName.includes('locale') ||
      dirParts.some((d) => ['i18n', 'l10n', 'lang', 'langs', 'locale', 'locales', 'messages', 'translations'].includes(d)))
  ) {
    return { match: true, formatHint: 'properties' };
  }

  // JSON localization files (strictly skip configs like package.json / tsconfig / etc.)
  if (baseName.endsWith('.json') && !IGNORED_JSON_NAMES.has(baseName)) {
    const stem = baseName.replace(/\.json$/, '');
    const inLocaleFolder = dirParts.some((d) =>
      ['locales', 'locale', 'i18n', 'l10n', 'lang', 'langs', 'translations', 'translation', 'packs', 'strings', 'uiLocales'.toLowerCase()].includes(d)
    );
    const isLangStem =
      KNOWN_LANG_CODES.has(stem) ||
      /^pack_[a-z]{2}(_[a-z]{2})?$/.test(stem) ||
      /^(intl|strings|messages|locale|lang)_[a-z]{2}/.test(stem) ||
      stem === 'strings' ||
      stem === 'messages' ||
      stem === 'translation' ||
      stem === 'translations';

    if (inLocaleFolder || isLangStem) {
      return { match: true, formatHint: 'json' };
    }
  }

  return { match: false };
}

function inferLanguageHintFromPath(path: string): string {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  const valuesMatch = normalized.match(/values-([a-z]{2}(?:-r[a-z]{2})?)\//);
  if (valuesMatch) return valuesMatch[1].replace('-r', '-');

  const lprojMatch = normalized.match(/([a-z]{2}(?:-[a-z]{2})?)\.lproj\//);
  if (lprojMatch) return lprojMatch[1];

  const base = (normalized.split('/').pop() || '').replace(/\.(json|arb|xml|strings|properties)$/, '');
  const packMatch = base.match(/(?:pack|intl|messages|strings|locale|lang)[_-]([a-z]{2}(?:[_-][a-z]{2})?)$/);
  if (packMatch) return packMatch[1].replace('_', '-');

  if (KNOWN_LANG_CODES.has(base)) return base.replace('_', '-');
  return 'auto';
}

function classifySkippedEntry(path: string): keyof SkippedBreakdown {
  const lower = path.toLowerCase();
  if (
    /\.(dex|so|dll|exe|class|jar|aar|kt|java|swift|m|h|c|cpp|ts|tsx|js|jsx|mjs|cjs|dart|py|wasm|o|a)$/.test(lower)
  ) {
    return 'codeAndBinaries';
  }
  if (
    /\.(png|jpg|jpeg|webp|gif|svg|ico|bmp|ttf|otf|woff|woff2|mp3|wav|ogg|aac|mp4|webm|mov|lottie)$/.test(lower)
  ) {
    return 'mediaAndAssets';
  }
  return 'configAndOther';
}

export async function analyzeAppPackage(
  file: File | ArrayBuffer,
  explicitFileName?: string
): Promise<AppAnalysisResult> {
  const fileName = explicitFileName || (file instanceof File ? file.name : 'app_package.zip');
  const sizeBytes = file instanceof File ? file.size : file.byteLength;

  if (sizeBytes > MAX_APP_ARCHIVE_BYTES) {
    throw new Error('APP_TOO_LARGE');
  }

  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error('INVALID_APP_ARCHIVE');
  }

  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const entryPaths = fileEntries.map((e) => e.name);
  const appKind = classifyAppKind(fileName, entryPaths);

  let appName = fileName.replace(/\.(apk|aab|ipa|zip)$/i, '');
  let packageId = '';
  let usedBinaryArsc = false;

  const skippedBreakdown: SkippedBreakdown = {
    codeAndBinaries: 0,
    mediaAndAssets: 0,
    configAndOther: 0,
  };
  let skippedFilesCount = 0;

  const extractedLanguageFiles: ExtractedLanguageFile[] = [];
  const extractedPaths = new Set<string>();

  // First try inspecting lightweight metadata (package.json / capacitor.config.json / app.json)
  for (const metaPath of ['package.json', 'capacitor.config.json', 'assets/public/capacitor.config.json']) {
    const entry = zip.file(metaPath);
    if (entry) {
      try {
        const text = await entry.async('string');
        const parsed = JSON.parse(text);
        if (typeof parsed.appName === 'string' && parsed.appName.trim()) appName = parsed.appName.trim();
        else if (typeof parsed.name === 'string' && parsed.name.trim()) appName = parsed.name.trim();
        if (typeof parsed.appId === 'string' && parsed.appId.trim()) packageId = parsed.appId.trim();
      } catch {
        // Ignore non-JSON metadata
      }
    }
  }

  // Parse compiled resources.arsc if present (native Android APKs)
  const arscEntry = zip.file('resources.arsc') || zip.file('base/resources.arsc');
  if (arscEntry) {
    try {
      const arscBytes = await arscEntry.async('uint8array');
      const arscResult = parseResourcesArsc(arscBytes);
      if (arscResult) {
        if (arscResult.packageName && !packageId) {
          packageId = arscResult.packageName;
        }
        for (const f of arscResult.files) {
          const parsedDoc = parseDocumentForTranslation(f.xmlContent, 'strings.xml', 'xml');
          if (parsedDoc.entries.length > 0) {
            usedBinaryArsc = true;
            extractedPaths.add(f.path.toLowerCase());
            extractedLanguageFiles.push({
              id: `arsc_${extractedLanguageFiles.length}`,
              path: f.path,
              fileName: 'strings.xml',
              format: 'xml',
              detectedLangHint: f.langHint,
              sourceKind: 'compiled-arsc',
              content: f.xmlContent,
              entryCount: parsedDoc.entries.length,
              previewEntries: parsedDoc.entries.slice(0, 6),
            });
          }
        }
      }
    } catch {
      // Ignore malformed resources.arsc and fall back to plain-text scanning
    }
  }

  // Scan all files inside the archive: skip code/media/binaries, extract ONLY language files
  for (const entry of fileEntries) {
    const path = entry.name;
    const candidate = isLanguageFileCandidate(path);

    if (!candidate.match) {
      skippedFilesCount++;
      const bucket = classifySkippedEntry(path);
      skippedBreakdown[bucket]++;
      continue;
    }

    // Avoid duplicating strings.xml if already extracted cleanly from resources.arsc at same path
    if (extractedPaths.has(path.toLowerCase())) {
      continue;
    }

    try {
      const bytes = await entry.async('uint8array');
      if (isBinaryBuffer(bytes)) {
        skippedFilesCount++;
        skippedBreakdown.codeAndBinaries++;
        continue;
      }

      const content = decodeTextBytes(bytes);
      const baseName = path.split('/').pop() || path;
      const parsedDoc = parseDocumentForTranslation(content, baseName, candidate.formatHint);

      if (parsedDoc.entries.length === 0) {
        skippedFilesCount++;
        skippedBreakdown.configAndOther++;
        continue;
      }

      // Infer app name from default Android strings.xml app_name entry if found
      if (baseName.toLowerCase() === 'strings.xml') {
        const appNameEntry = parsedDoc.entries.find((e) => e.label === 'app_name');
        if (appNameEntry && appNameEntry.originalText) {
          appName = appNameEntry.originalText;
        }
      }

      extractedLanguageFiles.push({
        id: `lang_${extractedLanguageFiles.length}`,
        path,
        fileName: baseName,
        format: parsedDoc.format,
        detectedLangHint: inferLanguageHintFromPath(path),
        sourceKind: 'plain-text',
        content,
        entryCount: parsedDoc.entries.length,
        previewEntries: parsedDoc.entries.slice(0, 6),
      });
    } catch {
      skippedFilesCount++;
      skippedBreakdown.configAndOther++;
    }
  }

  return {
    appFileName: fileName,
    appSizeBytes: sizeBytes,
    appKind,
    appName,
    packageId,
    totalFilesCount: fileEntries.length,
    skippedFilesCount,
    skippedBreakdown,
    extractedLanguageFiles,
    usedBinaryArsc,
  };
}

export async function bundleTranslatedFilesZip(
  items: TranslatedLanguageFileBundle[]
): Promise<Blob> {
  const zip = new JSZip();
  for (const item of items) {
    zip.file(item.outputPath, item.content);
  }
  return zip.generateAsync({ type: 'blob' });
}

export async function createDemoAppPackageFile(): Promise<File> {
  const zip = new JSZip();

  // Simulated non-language app files (to demonstrate analyzer filtering them out)
  zip.file('AndroidManifest.xml', new Uint8Array([0x03, 0x00, 0x08, 0x00, 0x10, 0x00, 0x00, 0x00]));
  zip.file('classes.dex', new Uint8Array([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00]));
  zip.file('lib/arm64-v8a/libcore.so', new Uint8Array([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]));
  zip.file('res/drawable-xxhdpi/app_icon.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  zip.file('src/MainActivity.kt', 'package com.demo.shop\nclass MainActivity {}');
  zip.file(
    'package.json',
    JSON.stringify({ name: 'SmartShop Mobile', appId: 'com.demo.smartshop', version: '2.1.0' }, null, 2)
  );

  // Actual language files inside the app package
  zip.file(
    'res/values/strings.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">SmartShop Mobile</string>
    <string name="welcome_title">Welcome back, %1$s!</string>
    <string name="search_products">Search products, brands, or categories</string>
    <string name="add_to_cart">Add to cart</string>
    <string name="checkout_now">Checkout now</string>
    <string name="order_confirmed">Your order has been confirmed!</string>
    <string name="settings_language">App Language</string>
    <string name="offline_notice">You are browsing in offline mode.</string>
</resources>`
  );

  zip.file(
    'assets/locales/en.json',
    JSON.stringify(
      {
        tabs: {
          home: 'Home',
          orders: 'My Orders',
          cart: 'Shopping Cart',
          profile: 'Account',
        },
        messages: {
          emptyCart: 'Your shopping cart is empty',
          freeShipping: 'Free delivery on orders over $50',
          thankYou: 'Thank you for shopping with us!',
        },
      },
      null,
      2
    )
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], 'SmartShop_v2.1_Sample.apk', { type: 'application/vnd.android.package-archive' });
}
