export type TrafficLevel = 'Low' | 'Medium' | 'Heavy' | 'Severe';
export type AirQuality = 'Good' | 'Moderate' | 'Poor' | 'Hazardous';
export type Weather = 'Clear' | 'Cloudy' | 'Rain' | 'Storm';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type PowerStatus = 'Normal' | 'Warning' | 'Failure';
export type WaterStatus = 'Normal' | 'LowPressure' | 'Contaminated' | 'Critical';
export type IncidentType = 'None' | 'Accident' | 'Fire' | 'Medical' | 'Crime' | 'RoadBlock';
export type EmergencyPriority = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
export type EntityType = 'Intersection' | 'Road' | 'Bus' | 'EmergencyVehicle' | 'Hospital' | 'School' | 'PowerSubstation' | 'WaterFacility' | 'PollutionSensor' | 'PublicSafetyZone' | 'ParkingZone';
export type SignalStatus = 'Normal' | 'Congested' | 'Offline';
export type RoadType = 'Arterial' | 'Highway' | 'Residential' | 'Commercial';
export type HospitalLoad = 'Normal' | 'High' | 'Critical';
export type PublicTransportStatus = 'Normal' | 'Delayed' | 'Suspended';
export type WasteLevel = 'Low' | 'Normal' | 'High' | 'Overflowing';
export type SensorStatus = 'Active' | 'Warning' | 'Offline';
export type EventStatus = 'None' | 'Active' | 'Planned' | 'Concluded';
export type District = 'Central Business District' | 'North Industrial Zone' | 'South Residential Zone' | 'East Transit Hub' | 'West Technology Park' | 'Riverside' | 'University District' | 'Medical District' | 'Old Town' | 'Airport Corridor';

export interface CityEntity {
  id: string;
  timestamp: number;
  x: number; // For visualization
  y: number; // For visualization
  
  district: District;
  zone: string;
  entityType: EntityType;
  
  // Categorical Data (Indexed)
  trafficLevel: TrafficLevel;
  roadType: RoadType;
  signalStatus: SignalStatus;
  incidentType: IncidentType;
  emergencyPriority: EmergencyPriority;
  airQuality: AirQuality;
  weather: Weather;
  powerStatus: PowerStatus;
  waterStatus: WaterStatus;
  wasteLevel: WasteLevel;
  hospitalLoad: HospitalLoad;
  publicTransportStatus: PublicTransportStatus;
  riskLevel: RiskLevel;
  sensorStatus: SensorStatus;
  eventStatus: EventStatus;
  
  // Continuous Data (For detail view, not indexed)
  temperature: number;
  vehicleDensity: number;
  pollutionLevel: number;
  populationDensity: number;
  busOccupancy: number;
  parkingAvailability: number;
  noiseLevel: number;
  schoolActivity: number;
}

export type CityField = keyof CityEntity;

// Query AST Definitions
export type CityQueryOperator = '=' | '!=';
export type CityLogicalOperator = 'AND' | 'OR' | 'XOR';

export interface CityQueryPredicate {
  type: 'predicate';
  column: CityField;
  operator: CityQueryOperator;
  value: string;
}

export interface CityLogicalNode {
  type: 'logical';
  operator: CityLogicalOperator;
  left: CityQueryNode;
  right: CityQueryNode;
}

export interface CityNotNode {
  type: 'not';
  operand: CityQueryNode;
}

export type CityQueryNode = CityQueryPredicate | CityLogicalNode | CityNotNode;

// To support the AI fallback JSON structure:
export interface AIStructuredCityQuery {
  domain: string;
  query: AIQueryAST;
  explanation: string;
}

export interface AIQueryAST {
  operator?: CityLogicalOperator | 'NOT';
  conditions?: (AIQueryCondition | AIQueryAST)[];
  column?: CityField;
  value?: string;
  // This is a loose representation that we'll convert into CityQueryNode
}

export interface AIQueryCondition {
  column: CityField;
  operator: CityQueryOperator;
  value: string;
}

// Bitmap structure is imported from lib/bitmap
import { Bitmap } from '@/lib/bitmap/types';
export type CityBitmapIndex = Record<string, Record<string, Bitmap>>;
