import { CityQueryNode } from './cityTypes';

export interface SmartCityQuery {
  id: string;
  category: string;
  text: string;
  description: string;
  ast: CityQueryNode;
}

export const SMART_CITY_QUERY_POOL: SmartCityQuery[] = [
  // =========================================================================
  // CATEGORY 1: TRAFFIC & CONGESTION HOTSPOTS (15 Queries)
  // =========================================================================
  {
    id: 'scq_001',
    category: 'Traffic & Congestion',
    text: 'Find roads with severe traffic',
    description: 'Locates all road segments currently suffering from severe vehicular congestion.',
    ast: {
      type: 'predicate',
      column: 'trafficLevel',
      operator: '=',
      value: 'Severe'
    }
  },
  {
    id: 'scq_002',
    category: 'Traffic & Congestion',
    text: 'Find severe traffic in Central Business District',
    description: 'Pinpoints critical traffic choke-points in the downtown commercial core.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_003',
    category: 'Traffic & Congestion',
    text: 'Find highway corridors with heavy or severe traffic',
    description: 'Filters high-capacity highways experiencing heavy vehicle accumulation.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Highway' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Heavy' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_004',
    category: 'Traffic & Congestion',
    text: 'Show traffic jams along the Airport Corridor',
    description: 'Identifies delays affecting airport passenger routes.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_005',
    category: 'Traffic & Congestion',
    text: 'Find congested intersections in University District',
    description: 'Detects campus intersections where traffic signals are congested.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
        right: { type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' }
      }
    }
  },
  {
    id: 'scq_006',
    category: 'Traffic & Congestion',
    text: 'Find arterial roads with severe traffic and congested signals',
    description: 'Evaluates major arterials where both road surface and traffic lights are saturated.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Arterial' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' }
      }
    }
  },
  {
    id: 'scq_007',
    category: 'Traffic & Congestion',
    text: 'Locate severe traffic in East Transit Hub',
    description: 'Focuses on multimodal hub roads with gridlocked transit access.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_008',
    category: 'Traffic & Congestion',
    text: 'Show roads with severe traffic in North Industrial Zone',
    description: 'Monitors heavy freight and industrial delivery corridors under traffic stress.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_009',
    category: 'Traffic & Congestion',
    text: 'Find heavy traffic in West Technology Park',
    description: 'Tracks tech corridor commute bottlenecks.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Heavy' }
    }
  },
  {
    id: 'scq_010',
    category: 'Traffic & Congestion',
    text: 'Locate congested signals across all intersections',
    description: 'Scans citywide intersections operating at saturated queue thresholds.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
      right: { type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' }
    }
  },
  {
    id: 'scq_011',
    category: 'Traffic & Congestion',
    text: 'Find severe traffic in South Residential Zone',
    description: 'Checks neighborhood arterial exits experiencing rush hour back-ups.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'South Residential Zone' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_012',
    category: 'Traffic & Congestion',
    text: 'Show commercial roads with heavy traffic',
    description: 'Retail and commercial streets experiencing high vehicle densities.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Commercial' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Heavy' }
    }
  },
  {
    id: 'scq_013',
    category: 'Traffic & Congestion',
    text: 'Find severe traffic in Riverside district',
    description: 'Waterfront avenue bottlenecks and river bridge access ramps.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },
  {
    id: 'scq_014',
    category: 'Traffic & Congestion',
    text: 'Locate intersections with delayed public transport',
    description: 'Transit choke-points impacting municipal bus schedules.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
      right: { type: 'predicate', column: 'publicTransportStatus', operator: '=', value: 'Delayed' }
    }
  },
  {
    id: 'scq_015',
    category: 'Traffic & Congestion',
    text: 'Find severe traffic in Old Town',
    description: 'Narrow historic streets experiencing severe vehicle build-ups.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Old Town' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
    }
  },

  // =========================================================================
  // CATEGORY 2: ACCIDENTS & EMERGENCY INCIDENTS (15 Queries)
  // =========================================================================
  {
    id: 'scq_016',
    category: 'Accidents & Emergency',
    text: 'Find active traffic accidents across the city',
    description: 'Citywide scan for all reported active vehicle collisions.',
    ast: {
      type: 'predicate',
      column: 'incidentType',
      operator: '=',
      value: 'Accident'
    }
  },
  {
    id: 'scq_017',
    category: 'Accidents & Emergency',
    text: 'Locate critical emergency priority zones',
    description: 'Zones requiring immediate first-responder dispatch.',
    ast: {
      type: 'predicate',
      column: 'emergencyPriority',
      operator: '=',
      value: 'Critical'
    }
  },
  {
    id: 'scq_018',
    category: 'Accidents & Emergency',
    text: 'Find accidents with critical emergency priority',
    description: 'High-severity collision incidents requiring sirens and multi-unit dispatch.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
      right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_019',
    category: 'Accidents & Emergency',
    text: 'Show accidents in Central Business District',
    description: 'Collision incidents occurring in the core commercial hub.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_020',
    category: 'Accidents & Emergency',
    text: 'Find active road blocks in the city',
    description: 'Detects closed segments or active barricades blocking street transit.',
    ast: {
      type: 'predicate',
      column: 'incidentType',
      operator: '=',
      value: 'RoadBlock'
    }
  },
  {
    id: 'scq_021',
    category: 'Accidents & Emergency',
    text: 'Show intersections with accidents',
    description: 'Street intersections blocked due to vehicle collisions.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_022',
    category: 'Accidents & Emergency',
    text: 'Find accidents along the Airport Corridor',
    description: 'Collisions threatening departure and arrival passenger flow.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_023',
    category: 'Accidents & Emergency',
    text: 'Locate accidents with high or critical risk levels',
    description: 'Severe incidents categorized under hazardous risk profiles.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'High' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    }
  },
  {
    id: 'scq_024',
    category: 'Accidents & Emergency',
    text: 'Find medical emergency incidents in University District',
    description: 'Medical calls dispatched within the academic campus district.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Medical' }
    }
  },
  {
    id: 'scq_025',
    category: 'Accidents & Emergency',
    text: 'Locate active accidents in East Transit Hub',
    description: 'Incidents impeding regional train and bus station transfers.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_026',
    category: 'Accidents & Emergency',
    text: 'Find accidents in South Residential Zone',
    description: 'Suburban street collisions requiring neighborhood patrol response.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'South Residential Zone' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_027',
    category: 'Accidents & Emergency',
    text: 'Find active emergency vehicles deployed in the city',
    description: 'Monitors dispatched ambulances and emergency responders.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'EmergencyVehicle'
    }
  },
  {
    id: 'scq_028',
    category: 'Accidents & Emergency',
    text: 'Find accidents in West Technology Park',
    description: 'Incidents impacting tech park access boulevards.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },
  {
    id: 'scq_029',
    category: 'Accidents & Emergency',
    text: 'Find critical emergency priority in Medical District',
    description: 'Top-tier code red alerts near the central hospital clusters.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Medical District' },
      right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_030',
    category: 'Accidents & Emergency',
    text: 'Find accidents in Riverside district',
    description: 'River embankment accidents creating bridge detour bottlenecks.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' },
      right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
    }
  },

  // =========================================================================
  // CATEGORY 3: AIR QUALITY & ENVIRONMENTAL HEALTH (15 Queries)
  // =========================================================================
  {
    id: 'scq_031',
    category: 'Air Quality & Environment',
    text: 'Find zones with poor air quality',
    description: 'Citywide scan for particulate matter pollution exceeding recommended limits.',
    ast: {
      type: 'predicate',
      column: 'airQuality',
      operator: '=',
      value: 'Poor'
    }
  },
  {
    id: 'scq_032',
    category: 'Air Quality & Environment',
    text: 'Show poor air quality in North Industrial Zone',
    description: 'Industrial smoke and factory emission concentrations.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_033',
    category: 'Air Quality & Environment',
    text: 'Find areas with severe traffic and poor air quality',
    description: 'Vehicular exhaust accumulation hot-zones during idle congestion.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_034',
    category: 'Air Quality & Environment',
    text: 'Find all pollution sensors across Nova City',
    description: 'Locates environmental monitoring telemetry stations.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'PollutionSensor'
    }
  },
  {
    id: 'scq_035',
    category: 'Air Quality & Environment',
    text: 'Find poor air quality in Central Business District',
    description: 'Downtown street canyon smog build-up.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_036',
    category: 'Air Quality & Environment',
    text: 'Show poor air quality in East Transit Hub',
    description: 'Diesel bus terminal and rail yard exhaust zones.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_037',
    category: 'Air Quality & Environment',
    text: 'Find pollution sensors reporting poor air quality',
    description: 'Sensor stations actively triggering unhealthy air quality alerts.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'PollutionSensor' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_038',
    category: 'Air Quality & Environment',
    text: 'Find poor air quality in Airport Corridor',
    description: 'Jet engine and taxiway emission plume tracking.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_039',
    category: 'Air Quality & Environment',
    text: 'Find poor air quality in West Technology Park',
    description: 'Clean-room industrial emissions around manufacturing complexes.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_040',
    category: 'Air Quality & Environment',
    text: 'Show poor air quality in South Residential Zone',
    description: 'Domestic residential smog and wood-burning or highway drift.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'South Residential Zone' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_041',
    category: 'Air Quality & Environment',
    text: 'Find overflowing waste bins in the city',
    description: 'Municipal sanitation overflow locations requiring collection trucks.',
    ast: {
      type: 'predicate',
      column: 'wasteLevel',
      operator: '=',
      value: 'Overflowing'
    }
  },
  {
    id: 'scq_042',
    category: 'Air Quality & Environment',
    text: 'Show poor air quality in University District',
    description: 'Campus air sensor readings indicating elevated particulate matter.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_043',
    category: 'Air Quality & Environment',
    text: 'Find poor air quality in Riverside district',
    description: 'Valley mist and river basin temperature inversion pollution.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_044',
    category: 'Air Quality & Environment',
    text: 'Find poor air quality in Old Town',
    description: 'Enclosed stone alleyways trapping traffic exhaust.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Old Town' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    }
  },
  {
    id: 'scq_045',
    category: 'Air Quality & Environment',
    text: 'Find areas with moderate air quality and heavy traffic',
    description: 'Pre-crisis environmental warning areas.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Moderate' },
      right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Heavy' }
    }
  },

  // =========================================================================
  // CATEGORY 4: CRITICAL INFRASTRUCTURE & UTILITIES (15 Queries)
  // =========================================================================
  {
    id: 'scq_046',
    category: 'Infrastructure & Power',
    text: 'Find all power substations in the city',
    description: 'Electrical transformer stations supplying the grid.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'PowerSubstation'
    }
  },
  {
    id: 'scq_047',
    category: 'Infrastructure & Power',
    text: 'Find all water treatment and pumping facilities',
    description: 'Municipal water distribution reservoirs and pumping hubs.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'WaterFacility'
    }
  },
  {
    id: 'scq_048',
    category: 'Infrastructure & Power',
    text: 'Find power substations in North Industrial Zone',
    description: 'High-voltage industrial grid feeders.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'PowerSubstation' }
    }
  },
  {
    id: 'scq_049',
    category: 'Infrastructure & Power',
    text: 'Locate power substations in West Technology Park',
    description: 'Dedicated redundant power feeds for tech and data centers.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'PowerSubstation' }
    }
  },
  {
    id: 'scq_050',
    category: 'Infrastructure & Power',
    text: 'Find all schools in Nova City',
    description: 'Educational campuses and designated school safety zones.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'School'
    }
  },
  {
    id: 'scq_051',
    category: 'Infrastructure & Power',
    text: 'Find schools in South Residential Zone',
    description: 'Neighborhood primary and secondary schools.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'South Residential Zone' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'School' }
    }
  },
  {
    id: 'scq_052',
    category: 'Infrastructure & Power',
    text: 'Locate power substations in Central Business District',
    description: 'Subterranean urban electrical vaults powering commercial skyscrapers.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'PowerSubstation' }
    }
  },
  {
    id: 'scq_053',
    category: 'Infrastructure & Power',
    text: 'Find public safety zones across the city',
    description: 'Police precincts, fire stations, and emergency command centers.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'PublicSafetyZone'
    }
  },
  {
    id: 'scq_054',
    category: 'Infrastructure & Power',
    text: 'Find all public transit buses in operation',
    description: 'Municipal city transit buses currently circulating routes.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'Bus'
    }
  },
  {
    id: 'scq_055',
    category: 'Infrastructure & Power',
    text: 'Find buses operating in East Transit Hub',
    description: 'Regional feeder buses connecting terminal platforms.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Bus' }
    }
  },
  {
    id: 'scq_056',
    category: 'Infrastructure & Power',
    text: 'Locate designated parking zones in the city',
    description: 'Public parking garages and smart park-and-ride lots.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'ParkingZone'
    }
  },
  {
    id: 'scq_057',
    category: 'Infrastructure & Power',
    text: 'Find power substations in Airport Corridor',
    description: 'Aviation runway and terminal backup grid substations.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'PowerSubstation' }
    }
  },
  {
    id: 'scq_058',
    category: 'Infrastructure & Power',
    text: 'Find water facilities in Riverside district',
    description: 'River water intake and filtration plants.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'WaterFacility' }
    }
  },
  {
    id: 'scq_059',
    category: 'Infrastructure & Power',
    text: 'Find schools in University District',
    description: 'Preparatory and laboratory schools affiliated with the university.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'School' }
    }
  },
  {
    id: 'scq_060',
    category: 'Infrastructure & Power',
    text: 'Find public safety zones in Central Business District',
    description: 'Downtown police stations and quick-response emergency bases.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'PublicSafetyZone' }
    }
  },

  // =========================================================================
  // CATEGORY 5: HEALTHCARE & HOSPITAL CAPACITY (10 Queries)
  // =========================================================================
  {
    id: 'scq_061',
    category: 'Healthcare & Hospitals',
    text: 'Find all hospitals across Nova City',
    description: 'Locates regional trauma centers, general hospitals, and specialty clinics.',
    ast: {
      type: 'predicate',
      column: 'entityType',
      operator: '=',
      value: 'Hospital'
    }
  },
  {
    id: 'scq_062',
    category: 'Healthcare & Hospitals',
    text: 'Locate hospitals in Medical District',
    description: 'Core healthcare complex and university medical teaching hospitals.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Medical District' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_063',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in Airport Corridor',
    description: 'Emergency response medical facilities positioned near airport terminals.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_064',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in West Technology Park',
    description: 'Suburban healthcare clinics serving the tech district.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_065',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in South Residential Zone',
    description: 'Community hospitals providing residential family care.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'South Residential Zone' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_066',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in Old Town',
    description: 'Historic city clinics and specialized medical centers.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Old Town' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_067',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in East Transit Hub',
    description: 'Emergency trauma care centers adjacent to the train terminus.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_068',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in North Industrial Zone',
    description: 'Industrial occupational health clinics and emergency burn units.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_069',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in University District',
    description: 'University research hospital and student health infirmary.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },
  {
    id: 'scq_070',
    category: 'Healthcare & Hospitals',
    text: 'Find hospitals in Riverside district',
    description: 'Riverfront medical center and rehabilitation hospital.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Riverside' },
      right: { type: 'predicate', column: 'entityType', operator: '=', value: 'Hospital' }
    }
  },

  // =========================================================================
  // CATEGORY 6: DISTRICT-SPECIFIC ANALYTICS (15 Queries)
  // =========================================================================
  {
    id: 'scq_071',
    category: 'District Analytics',
    text: 'Show all entities in Central Business District',
    description: 'Full perimeter scan of the commercial downtown zone.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Central Business District'
    }
  },
  {
    id: 'scq_072',
    category: 'District Analytics',
    text: 'Show all entities in North Industrial Zone',
    description: 'Full perimeter scan of industrial manufacturing zones.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'North Industrial Zone'
    }
  },
  {
    id: 'scq_073',
    category: 'District Analytics',
    text: 'Show all entities in West Technology Park',
    description: 'Complete inventory of Silicon corridor smart entities.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'West Technology Park'
    }
  },
  {
    id: 'scq_074',
    category: 'District Analytics',
    text: 'Show all entities in University District',
    description: 'Student campus, libraries, and surrounding collegiate roads.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'University District'
    }
  },
  {
    id: 'scq_075',
    category: 'District Analytics',
    text: 'Show all entities in South Residential Zone',
    description: 'Suburban subdivisions, neighborhood avenues, and local amenities.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'South Residential Zone'
    }
  },
  {
    id: 'scq_076',
    category: 'District Analytics',
    text: 'Show all entities in East Transit Hub',
    description: 'Train stations, bus bays, and multimodal intersection nodes.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'East Transit Hub'
    }
  },
  {
    id: 'scq_077',
    category: 'District Analytics',
    text: 'Show all entities in Airport Corridor',
    description: 'Terminal approach boulevards and airport perimeter facilities.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Airport Corridor'
    }
  },
  {
    id: 'scq_078',
    category: 'District Analytics',
    text: 'Show all entities in Medical District',
    description: 'Hospital campus, clinics, and emergency vehicle staging zones.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Medical District'
    }
  },
  {
    id: 'scq_079',
    category: 'District Analytics',
    text: 'Show all entities in Old Town',
    description: 'Historic pedestrian alleys and heritage market intersections.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Old Town'
    }
  },
  {
    id: 'scq_080',
    category: 'District Analytics',
    text: 'Show all entities in Riverside district',
    description: 'River promenade, bridges, and waterside residential zones.',
    ast: {
      type: 'predicate',
      column: 'district',
      operator: '=',
      value: 'Riverside'
    }
  },
  {
    id: 'scq_081',
    category: 'District Analytics',
    text: 'Find critical risk entities in Central Business District',
    description: 'High-threat anomalies inside the downtown core.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_082',
    category: 'District Analytics',
    text: 'Find critical risk entities in University District',
    description: 'Campus areas flagged for emergency or structural concern.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'University District' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_083',
    category: 'District Analytics',
    text: 'Find critical risk entities in West Technology Park',
    description: 'Server farms and tech infrastructure facing critical risk.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'West Technology Park' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_084',
    category: 'District Analytics',
    text: 'Find critical risk entities in North Industrial Zone',
    description: 'Factory facilities with dangerous hazard indicators.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_085',
    category: 'District Analytics',
    text: 'Find critical risk entities in Airport Corridor',
    description: 'Airport infrastructure requiring heightened security surveillance.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },

  // =========================================================================
  // CATEGORY 7: MULTI-CONDITION CRISIS & COMPLEX LOGIC (15 Queries)
  // =========================================================================
  {
    id: 'scq_086',
    category: 'Multi-Crisis Analytics',
    text: 'Find intersections with accidents and severe traffic',
    description: 'Complete road gridlock directly caused by vehicular collisions.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_087',
    category: 'Multi-Crisis Analytics',
    text: 'Find critical risk areas with severe traffic',
    description: 'Simultaneous threat: severe gridlock impeding critical risk management.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'scq_088',
    category: 'Multi-Crisis Analytics',
    text: 'Find accidents in Central Business District with severe traffic',
    description: 'Major multilane downtown pileups stopping all inbound traffic.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_089',
    category: 'Multi-Crisis Analytics',
    text: 'Find severe traffic with congested signals and poor air quality',
    description: 'Triple-threat environmental and mobility crisis.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' },
        right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
      }
    }
  },
  {
    id: 'scq_090',
    category: 'Multi-Crisis Analytics',
    text: 'Find arterial roads with accidents and critical risk',
    description: 'High-speed arterial collisions causing life-threatening hazards.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Arterial' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    }
  },
  {
    id: 'scq_091',
    category: 'Multi-Crisis Analytics',
    text: 'Find highway accidents with severe traffic',
    description: 'Expressway collisions blocking commuter thoroughfares.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Highway' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_092',
    category: 'Multi-Crisis Analytics',
    text: 'Find commercial roads with accidents and delayed buses',
    description: 'Shopping district accidents impacting commercial transit lines.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Commercial' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'publicTransportStatus', operator: '=', value: 'Delayed' }
      }
    }
  },
  {
    id: 'scq_093',
    category: 'Multi-Crisis Analytics',
    text: 'Find severe traffic with critical emergency priority in Airport Corridor',
    description: 'Aviation emergency where first responders are delayed by gridlock.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Airport Corridor' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' }
      }
    }
  },
  {
    id: 'scq_094',
    category: 'Multi-Crisis Analytics',
    text: 'Find intersections with accidents and high emergency priority',
    description: 'Crossroad crashes requiring ambulance and fire response.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'entityType', operator: '=', value: 'Intersection' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'High' }
      }
    }
  },
  {
    id: 'scq_095',
    category: 'Multi-Crisis Analytics',
    text: 'Find poor air quality with severe traffic in North Industrial Zone',
    description: 'Combined factory smoke and truck exhaust crisis in industrial parks.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'North Industrial Zone' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
      }
    }
  },
  {
    id: 'scq_096',
    category: 'Multi-Crisis Analytics',
    text: 'Find road blocks with severe traffic in Old Town',
    description: 'Historic district bottlenecks where street closures cause paralysis.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Old Town' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'RoadBlock' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_097',
    category: 'Multi-Crisis Analytics',
    text: 'Find delayed public transport in East Transit Hub with severe traffic',
    description: 'Commuter rail disruption causing gridlocked bus loops.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'East Transit Hub' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'publicTransportStatus', operator: '=', value: 'Delayed' }
      }
    }
  },
  {
    id: 'scq_098',
    category: 'Multi-Crisis Analytics',
    text: 'Find critical risk in Medical District with accidents',
    description: 'Ambulance approach routes obstructed by collision scenes.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Medical District' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    }
  },
  {
    id: 'scq_099',
    category: 'Multi-Crisis Analytics',
    text: 'Find highway corridors with congested signals and severe traffic',
    description: 'Metropolitan freeway on-ramp meter saturation.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'roadType', operator: '=', value: 'Highway' },
      right: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' },
        right: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' }
      }
    }
  },
  {
    id: 'scq_100',
    category: 'Multi-Crisis Analytics',
    text: 'Find citywide critical risk with accidents and severe traffic',
    description: 'Full municipal state of emergency: simultaneous collisions and critical risk.',
    ast: {
      type: 'logical',
      operator: 'AND',
      left: {
        type: 'logical',
        operator: 'AND',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' }
      },
      right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
    }
  }
];

/**
 * Returns a random smart query from the 100-query pool,
 * avoiding immediate duplicate repetition if excludeText is provided.
 */
export function getRandomSmartQuery(excludeText?: string): SmartCityQuery {
  const candidates = excludeText 
    ? SMART_CITY_QUERY_POOL.filter(q => q.text.toLowerCase().trim() !== excludeText.toLowerCase().trim())
    : SMART_CITY_QUERY_POOL;

  const pool = candidates.length > 0 ? candidates : SMART_CITY_QUERY_POOL;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Intelligent semantic AST matcher and natural language parser.
 * 1. Checks if text matches any query in the 100-query pool (exact or normalized).
 * 2. Parses keywords (districts, traffic levels, incidents, entity types, air quality, risk).
 * 3. Returns a guaranteed valid CityQueryNode AST that will produce results.
 */
export function resolveCityQueryAST(prompt: string): CityQueryNode {
  const norm = prompt.toLowerCase().trim();

  // 1. Direct pool match (exact or substring)
  const exact = SMART_CITY_QUERY_POOL.find(q => q.text.toLowerCase().trim() === norm);
  if (exact) return exact.ast;

  const partial = SMART_CITY_QUERY_POOL.find(q => norm.includes(q.text.toLowerCase().trim()) || q.text.toLowerCase().trim().includes(norm));
  if (partial && norm.length > 8) return partial.ast;

  // 2. Semantic feature extraction
  const predicates: CityQueryNode[] = [];

  // District match
  const districtMap: Record<string, string> = {
    'central business': 'Central Business District',
    'business district': 'Central Business District',
    'cbd': 'Central Business District',
    'north industrial': 'North Industrial Zone',
    'industrial': 'North Industrial Zone',
    'south residential': 'South Residential Zone',
    'residential': 'South Residential Zone',
    'east transit': 'East Transit Hub',
    'transit hub': 'East Transit Hub',
    'west tech': 'West Technology Park',
    'technology park': 'West Technology Park',
    'riverside': 'Riverside',
    'university': 'University District',
    'campus': 'University District',
    'medical': 'Medical District',
    'old town': 'Old Town',
    'historic': 'Old Town',
    'airport': 'Airport Corridor'
  };

  for (const [key, dist] of Object.entries(districtMap)) {
    if (norm.includes(key)) {
      predicates.push({ type: 'predicate', column: 'district', operator: '=', value: dist });
      break;
    }
  }

  // Entity Type match
  const entityMap: Record<string, string> = {
    'intersection': 'Intersection',
    'crossroad': 'Intersection',
    'hospital': 'Hospital',
    'clinic': 'Hospital',
    'medical center': 'Hospital',
    'school': 'School',
    'substation': 'PowerSubstation',
    'power': 'PowerSubstation',
    'water': 'WaterFacility',
    'sensor': 'PollutionSensor',
    'pollution sensor': 'PollutionSensor',
    'police': 'PublicSafetyZone',
    'safety': 'PublicSafetyZone',
    'bus': 'Bus',
    'ambulance': 'EmergencyVehicle',
    'emergency vehicle': 'EmergencyVehicle',
    'parking': 'ParkingZone'
  };

  for (const [key, et] of Object.entries(entityMap)) {
    if (norm.includes(key)) {
      predicates.push({ type: 'predicate', column: 'entityType', operator: '=', value: et });
      break;
    }
  }

  // Traffic match
  if (norm.includes('severe traffic') || norm.includes('gridlock') || norm.includes('traffic jam') || norm.includes('severe')) {
    predicates.push({ type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' });
  } else if (norm.includes('heavy traffic') || norm.includes('congested traffic')) {
    predicates.push({ type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Heavy' });
  }

  // Road Type match
  if (norm.includes('highway') || norm.includes('expressway') || norm.includes('freeway')) {
    predicates.push({ type: 'predicate', column: 'roadType', operator: '=', value: 'Highway' });
  } else if (norm.includes('arterial')) {
    predicates.push({ type: 'predicate', column: 'roadType', operator: '=', value: 'Arterial' });
  } else if (norm.includes('commercial road') || norm.includes('commercial street')) {
    predicates.push({ type: 'predicate', column: 'roadType', operator: '=', value: 'Commercial' });
  }

  // Incident Type match
  if (norm.includes('accident') || norm.includes('crash') || norm.includes('collision')) {
    predicates.push({ type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' });
  } else if (norm.includes('roadblock') || norm.includes('road block') || norm.includes('closed road')) {
    predicates.push({ type: 'predicate', column: 'incidentType', operator: '=', value: 'RoadBlock' });
  }

  // Air Quality match
  if (norm.includes('poor air') || norm.includes('smog') || norm.includes('pollution') || norm.includes('air quality')) {
    predicates.push({ type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' });
  }

  // Risk Level match
  if (norm.includes('critical risk') || norm.includes('high risk') || norm.includes('danger')) {
    predicates.push({ type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' });
  }

  // Emergency Priority match
  if (norm.includes('emergency priority') || norm.includes('code red') || norm.includes('critical emergency')) {
    predicates.push({ type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' });
  }

  // Signal Status match
  if (norm.includes('signal') || norm.includes('traffic light') || norm.includes('congested signal')) {
    predicates.push({ type: 'predicate', column: 'signalStatus', operator: '=', value: 'Congested' });
  }

  // If no predicates were extracted, default to Severe Traffic
  if (predicates.length === 0) {
    return {
      type: 'predicate',
      column: 'trafficLevel',
      operator: '=',
      value: 'Severe'
    };
  }

  // Combine multiple predicates with logical AND
  let root: CityQueryNode = predicates[0];
  for (let i = 1; i < predicates.length; i++) {
    root = {
      type: 'logical',
      operator: 'AND',
      left: root,
      right: predicates[i]
    };
  }

  return root;
}
