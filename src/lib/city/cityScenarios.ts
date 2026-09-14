import { CityEntity, CityQueryNode } from './cityTypes';
import { generateCityData } from './cityGenerator';

// A preset scenario mutation applies a transformation to the dataset 
// to simulate a crisis, and then we rebuild the index.
export type ScenarioTransformation = (dataset: CityEntity[]) => CityEntity[];

export const applyRushHour: ScenarioTransformation = (dataset) => {
  return dataset.map(entity => {
    const updated = { ...entity };
    if (updated.roadType === 'Highway' || updated.roadType === 'Arterial' || updated.district === 'Central Business District') {
      if (Math.random() > 0.3) updated.trafficLevel = 'Severe';
      else if (Math.random() > 0.5) updated.trafficLevel = 'Heavy';
      if (updated.trafficLevel === 'Severe') updated.signalStatus = 'Congested';
      updated.vehicleDensity += 50;
    }
    return updated;
  });
};

export const applyHeavyRain: ScenarioTransformation = (dataset) => {
  return dataset.map(entity => {
    const updated = { ...entity };
    updated.weather = 'Rain';
    if (updated.trafficLevel === 'Medium' || updated.trafficLevel === 'Heavy') {
      updated.trafficLevel = 'Severe'; // Rain worsens traffic
    }
    updated.airQuality = 'Good'; // Rain washes away pollution
    if (Math.random() > 0.95) updated.powerStatus = 'Warning';
    return updated;
  });
};

export const applyMajorAccident: ScenarioTransformation = (dataset) => {
  // Create a localized accident in the central business district
  return dataset.map(entity => {
    const updated = { ...entity };
    if (updated.district === 'Central Business District' && updated.entityType === 'Intersection') {
      if (Math.random() > 0.9) {
        updated.incidentType = 'Accident';
        updated.emergencyPriority = 'Critical';
        updated.trafficLevel = 'Severe';
        updated.roadType = 'Arterial'; 
        updated.riskLevel = 'Critical';
      }
    }
    // Ripple effect
    if (updated.district === 'Central Business District' && updated.incidentType !== 'Accident') {
      if (Math.random() > 0.4) updated.trafficLevel = 'Heavy';
    }
    return updated;
  });
};

export const applyAirPollutionEvent: ScenarioTransformation = (dataset) => {
  return dataset.map(entity => {
    const updated = { ...entity };
    if (updated.district === 'North Industrial Zone') {
      updated.airQuality = 'Hazardous';
      updated.pollutionLevel += 200;
      updated.riskLevel = 'High';
    } else {
      updated.airQuality = Math.random() > 0.5 ? 'Poor' : 'Moderate';
      updated.pollutionLevel += 100;
    }
    return updated;
  });
};

export const applyCityCrisis: ScenarioTransformation = (dataset) => {
  // Severe traffic everywhere, poor air quality, major accidents, hospital overload
  return dataset.map(entity => {
    const updated = { ...entity };
    updated.weather = 'Storm';
    if (Math.random() > 0.3) updated.trafficLevel = 'Severe';
    if (Math.random() > 0.5) updated.airQuality = 'Poor';
    
    if (updated.entityType === 'Hospital') {
      updated.hospitalLoad = 'Critical';
    }

    if (Math.random() > 0.95) {
      updated.incidentType = 'Accident';
      updated.emergencyPriority = 'Critical';
      updated.riskLevel = 'Critical';
    }
    
    if (Math.random() > 0.9) {
      updated.powerStatus = 'Failure';
    }

    return updated;
  });
};

// Also define standard preset query ASTs
export const PRESET_QUERIES: Record<string, CityQueryNode> = {
  'Traffic Hotspots': {
    type: 'predicate',
    column: 'trafficLevel',
    operator: '=',
    value: 'Severe'
  },
  'Pollution Hotspots': {
    type: 'predicate',
    column: 'airQuality',
    operator: '=',
    value: 'Poor'
  },
  'Accident Zones': {
    type: 'predicate',
    column: 'incidentType',
    operator: '=',
    value: 'Accident'
  },
  'Emergency Zones': {
    type: 'predicate',
    column: 'emergencyPriority',
    operator: '=',
    value: 'High'
  },
  'Hospital Overload': {
    type: 'predicate',
    column: 'hospitalLoad',
    operator: '=',
    value: 'Critical'
  },
  'Power Failures': {
    type: 'predicate',
    column: 'powerStatus',
    operator: '=',
    value: 'Failure'
  },
  'Multi-Crisis': {
    type: 'logical',
    operator: 'AND',
    left: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'airQuality', operator: '=', value: 'Poor' }
    },
    right: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' },
      right: { type: 'predicate', column: 'hospitalLoad', operator: '=', value: 'Critical' }
    }
  }
};
