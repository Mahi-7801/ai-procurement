interface RFPData {
  content: string;
  metadata?: Record<string, any>;
  platform?: string;
}

const rfpStore: Record<string, RFPData> = {};

export function saveRfp(tenderId: string, content: string, metadata?: Record<string, any>, platform?: string) {
  rfpStore[tenderId] = { content, metadata, platform };
}

export function getRfp(tenderId: string): string | undefined {
  return rfpStore[tenderId]?.content;
}

export function getRfpFull(tenderId: string): RFPData | undefined {
  return rfpStore[tenderId];
}

