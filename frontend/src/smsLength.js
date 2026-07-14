const GSM7_BASIC = new Set([
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', ' ', '!', '"', '#', '¤', '%',
  '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6',
  '7', '8', '9', ':', ';', '<', '=', '>', '?', '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§', '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
  'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'ä', 'ö', 'ñ', 'ü', 'à',
]);

const GSM7_EXTENDED = new Set(['^', '{', '}', '\\', '[', '~', ']', '|', '€']);

export function calculateSmsMeta(text, maxSegments = 10) {
  const message = String(text || '');
  if (!message) {
    return {
      encoding: 'GSM-7',
      lengthUnits: 0,
      singleLimit: 160,
      concatLimit: 153,
      segments: 0,
      perSegmentLimit: 160,
      maxSegments,
      isMultipart: false,
      isWithinLimit: true,
      maxUnitsAllowed: 160,
    };
  }

  let isGsm7 = true;
  let septetLength = 0;

  for (const ch of message) {
    if (GSM7_BASIC.has(ch)) {
      septetLength += 1;
    } else if (GSM7_EXTENDED.has(ch)) {
      septetLength += 2;
    } else {
      isGsm7 = false;
      break;
    }
  }

  const encoding = isGsm7 ? 'GSM-7' : 'UCS-2';
  const lengthUnits = isGsm7 ? septetLength : message.length;
  const singleLimit = isGsm7 ? 160 : 70;
  const concatLimit = isGsm7 ? 153 : 67;
  const segments = lengthUnits <= singleLimit
    ? 1
    : 1 + Math.ceil((lengthUnits - singleLimit) / concatLimit);
  const perSegmentLimit = segments <= 1 ? singleLimit : concatLimit;
  const maxUnitsAllowed = maxSegments <= 1
    ? singleLimit
    : singleLimit + ((maxSegments - 1) * concatLimit);
  const isWithinLimit = segments <= maxSegments;

  return {
    encoding,
    lengthUnits,
    singleLimit,
    concatLimit,
    segments,
    perSegmentLimit,
    maxSegments,
    isMultipart: segments > 1,
    isWithinLimit,
    maxUnitsAllowed,
  };
}
