import { CityEntity, District, EntityType, TrafficLevel, AirQuality, Weather, RiskLevel, PowerStatus, WaterStatus, IncidentType, EmergencyPriority, SignalStatus, RoadType, HospitalLoad, PublicTransportStatus, WasteLevel, SensorStatus, EventStatus } from './cityTypes';

// Simple deterministic PRNG (Mulberry32)
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export const DISTRICTS: District[] = [
  'Central Business District', 'North Industrial Zone', 'South Residential Zone', 
  'East Transit Hub', 'West Technology Park', 'Riverside', 'University District', 
  'Medical District', 'Old Town', 'Airport Corridor'
];

const ENTITY_TYPES: EntityType[] = ['Intersection', 'Road', 'Bus', 'EmergencyVehicle', 'Hospital', 'School', 'PowerSubstation', 'WaterFacility', 'PollutionSensor', 'PublicSafetyZone', 'ParkingZone'];
const WEATHER_TYPES: Weather[] = ['Clear', 'Cloudy', 'Rain', 'Storm'];
const ROAD_TYPES: RoadType[] = ['Arterial', 'Highway', 'Residential', 'Commercial'];

export interface GeneratorConfig {
  seed: number;
  count: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  weather: Weather;
  scenario?: 'None' | 'RushHour' | 'HeavyRain' | 'MajorAccident' | 'CityCrisis';
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(weights: [T, number][], rng: () => number): T {
  const total = weights.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [val, w] of weights) {
    if (r < w) return val;
    r -= w;
  }
  return weights[0][0];
}

export function generateCityData(config: GeneratorConfig): CityEntity[] {
  const rng = mulberry32(config.seed);
  const entities: CityEntity[] = [];

  for (let i = 0; i < config.count; i++) {
    const district = pickRandom(DISTRICTS, rng);
    
    // Abstract coordinates based on district logic for clustering
    const districtIndex = DISTRICTS.indexOf(district);
    const baseX = (districtIndex % 3) * 33 + rng() * 30; // 0-100 scale roughly
    const baseY = Math.floor(districtIndex / 3) * 25 + rng() * 20;

    const entityType = pickWeighted([
      ['Intersection', 30], ['Road', 40], ['Bus', 5], ['EmergencyVehicle', 2], 
      ['Hospital', 1], ['School', 2], ['PowerSubstation', 2], ['WaterFacility', 2], 
      ['PollutionSensor', 10], ['PublicSafetyZone', 3], ['ParkingZone', 3]
    ], rng);

    // Default uncorrelated
    let trafficLevel: TrafficLevel = 'Low';
    let airQuality: AirQuality = 'Good';
    let riskLevel: RiskLevel = 'Low';
    let incidentType: IncidentType = 'None';
    let emergencyPriority: EmergencyPriority = 'None';
    let powerStatus: PowerStatus = 'Normal';
    let hospitalLoad: HospitalLoad = 'Normal';

    // Time of day correlation
    let trafficWeights: [TrafficLevel, number][] = [['Low', 40], ['Medium', 40], ['Heavy', 15], ['Severe', 5]];
    if (config.timeOfDay === 'Morning' || config.timeOfDay === 'Evening') {
      trafficWeights = [['Low', 10], ['Medium', 30], ['Heavy', 40], ['Severe', 20]];
    }

    // Weather correlation
    if (config.weather === 'Rain' || config.weather === 'Storm') {
      // Shift traffic up
      trafficWeights = [['Low', 5], ['Medium', 25], ['Heavy', 40], ['Severe', 30]];
    }

    // Scenario correlation
    if (config.scenario === 'RushHour') {
      trafficWeights = [['Low', 0], ['Medium', 10], ['Heavy', 40], ['Severe', 50]];
    } else if (config.scenario === 'MajorAccident') {
      if (district === 'Central Business District') {
        trafficWeights = [['Low', 0], ['Medium', 0], ['Heavy', 20], ['Severe', 80]];
      }
    } else if (config.scenario === 'CityCrisis') {
      trafficWeights = [['Low', 0], ['Medium', 5], ['Heavy', 35], ['Severe', 60]];
    }

    trafficLevel = pickWeighted(trafficWeights, rng);

    // Incident correlation (higher traffic = more accidents)
    let incidentWeights: [IncidentType, number][] = [['None', 90], ['Accident', 5], ['Medical', 2], ['Fire', 1], ['Crime', 1], ['RoadBlock', 1]];
    if (trafficLevel === 'Heavy' || trafficLevel === 'Severe') {
      incidentWeights = [['None', 70], ['Accident', 20], ['Medical', 5], ['RoadBlock', 5]];
    }
    if (config.scenario === 'MajorAccident' && i % 100 === 0) {
      incidentType = 'Accident';
    } else {
      incidentType = pickWeighted(incidentWeights, rng);
    }

    // Emergency Priority correlation
    if (incidentType === 'Accident' || incidentType === 'Fire') {
      emergencyPriority = pickWeighted([['High', 60], ['Critical', 40]], rng);
      riskLevel = pickWeighted([['High', 50], ['Critical', 50]], rng);
    } else if (incidentType !== 'None') {
      emergencyPriority = pickWeighted([['Low', 30], ['Medium', 50], ['High', 20]], rng);
    }

    // Air Quality correlation (traffic + weather)
    let aqWeights: [AirQuality, number][] = [['Good', 50], ['Moderate', 40], ['Poor', 10], ['Hazardous', 0]];
    if (trafficLevel === 'Severe') {
      aqWeights = [['Good', 10], ['Moderate', 40], ['Poor', 40], ['Hazardous', 10]];
    }
    if (config.weather === 'Rain' || config.weather === 'Storm') {
      aqWeights = [['Good', 80], ['Moderate', 20], ['Poor', 0], ['Hazardous', 0]]; // Rain clears air
    }
    if (config.scenario === 'CityCrisis') {
      aqWeights = [['Good', 0], ['Moderate', 20], ['Poor', 50], ['Hazardous', 30]];
    }
    airQuality = pickWeighted(aqWeights, rng);

    // Power Status
    if (config.scenario === 'CityCrisis' || config.weather === 'Storm') {
      powerStatus = pickWeighted([['Normal', 70], ['Warning', 20], ['Failure', 10]], rng);
    }

    // Hospital Load
    if (config.scenario === 'CityCrisis' || config.scenario === 'MajorAccident') {
      if (district === 'Medical District' || entityType === 'Hospital') {
        hospitalLoad = pickWeighted([['Normal', 10], ['High', 40], ['Critical', 50]], rng);
      }
    }

    entities.push({
      id: `ENT-${10000 + i}`,
      timestamp: Date.now(),
      x: baseX,
      y: baseY,
      district,
      zone: `Zone-${Math.floor(rng() * 100)}`,
      entityType: entityType as EntityType,
      trafficLevel,
      roadType: pickRandom(ROAD_TYPES, rng),
      signalStatus: trafficLevel === 'Severe' ? pickWeighted([['Congested', 80], ['Offline', 20]], rng) : 'Normal',
      incidentType,
      emergencyPriority,
      airQuality,
      weather: config.weather,
      powerStatus,
      waterStatus: pickWeighted([['Normal', 95], ['LowPressure', 4], ['Contaminated', 1]], rng),
      wasteLevel: pickWeighted([['Low', 20], ['Normal', 60], ['High', 15], ['Overflowing', 5]], rng),
      hospitalLoad,
      publicTransportStatus: trafficLevel === 'Severe' ? 'Delayed' : 'Normal',
      riskLevel,
      sensorStatus: pickWeighted([['Active', 95], ['Warning', 4], ['Offline', 1]], rng),
      eventStatus: 'None',
      temperature: 15 + rng() * 15, // 15 to 30 C
      vehicleDensity: trafficLevel === 'Severe' ? 80 + rng() * 20 : rng() * 80,
      pollutionLevel: airQuality === 'Hazardous' ? 200 + rng() * 100 : rng() * 200,
      populationDensity: rng() * 10000,
      busOccupancy: rng() * 100,
      parkingAvailability: rng() * 100,
      noiseLevel: rng() * 120,
      schoolActivity: rng() * 100
    });
  }

  return entities;
}
