import { HubCode } from './pricing.types';

const IATA_TO_HUB: Record<string, HubCode> = {
  VNO: 'VNO',
  KUN: 'VNO',
  PLQ: 'VNO',
  SQQ: 'VNO',
  PNV: 'VNO',
  WAW: 'WAW',
  KRK: 'WAW',
  GDN: 'WAW',
  WRO: 'WAW',
  POZ: 'WAW',
  RIX: 'RIX',
  TLL: 'TLL',
  HEL: 'HEL',
  ARN: 'ARN',
  GOT: 'ARN',
  CPH: 'CPH',
  AAL: 'CPH',
  AMS: 'AMS',
  FRA: 'FRA',
  MUC: 'MUC',
  DUS: 'FRA',
  HAM: 'FRA',
  STR: 'FRA',
  CDG: 'CDG',
  LYS: 'CDG',
  NCE: 'CDG',
  MAD: 'MAD',
  BCN: 'MAD',
  FCO: 'FCO',
  MXP: 'FCO',
  LIN: 'FCO',
  LHR: 'LHR',
  LGW: 'LHR',
  STN: 'LHR',
  MAN: 'LHR',
  DUB: 'DUB',
  ZRH: 'ZRH',
  GVA: 'ZRH',
  VIE: 'VIE',
  BUD: 'BUD',
  PRG: 'PRG',
  BRU: 'BRU',
  CRL: 'BRU',
};

const FALLBACK_HUB: HubCode = 'VNO';

export function normalizeToHub(originCode: string): HubCode {
  return IATA_TO_HUB[originCode.toUpperCase()] ?? FALLBACK_HUB;
}
