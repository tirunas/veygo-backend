export type HubCode =
  | 'VNO'
  | 'WAW'
  | 'RIX'
  | 'TLL'
  | 'HEL'
  | 'ARN'
  | 'CPH'
  | 'AMS'
  | 'FRA'
  | 'CDG'
  | 'MAD'
  | 'FCO'
  | 'LHR'
  | 'DUB'
  | 'ZRH'
  | 'VIE'
  | 'BUD'
  | 'PRG'
  | 'BRU'
  | 'MUC';

export interface PriceEntry {
  destinationId: string;
  hubCode: HubCode;
  startingPrice: number;
  flightHours: number;
  currency: string;
}

export interface BatchPriceRequest {
  originCode: string;
  destinationIds: string[];
}

export interface BatchPriceResponse {
  prices: PriceEntry[];
}

export interface DetectOriginResponse {
  hubCode: HubCode;
}
