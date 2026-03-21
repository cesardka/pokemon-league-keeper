export interface EventWithCounts {
  id: string;
  storeId: string;
  name: string;
  game: string;
  date: Date;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  createdAt: Date;
  updatedAt: Date;
  _count: {
    barcodes: number;
    rounds: number;
  };
}

export interface BarcodeData {
  id: string;
  eventId: string;
  roundId: string | null;
  value: string;
  scannedAt: Date;
  scannedBy: string;
}
