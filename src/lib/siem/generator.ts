import { SecurityEvent } from './types';

// Deterministic simple seeded random generator for synthetic data
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextRange(min, max + 1));
  }

  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  pickWeighted<T>(items: { item: T; weight: number }[]): T {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let r = this.nextRange(0, total);
    for (const { item, weight } of items) {
      r -= weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1].item;
  }
}

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
export const EVENT_TYPES = [
  'Login Success', 'Failed Login', 'Privilege Escalation', 'Port Scan',
  'Malware Detection', 'Suspicious Process', 'Brute Force', 'SQL Injection Attempt',
  'XSS Attempt', 'Firewall Block', 'Firewall Allow', 'Data Exfiltration',
  'DNS Anomaly', 'Ransomware Indicator', 'Unauthorized Access', 'Account Lockout'
];
export const ACTIONS = ['Allow', 'Block', 'Alert', 'Quarantine', 'Terminate', 'Ignore'];
export const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH'];
export const DEVICE_TYPES = ['Workstation', 'Server', 'Firewall', 'Router', 'Database', 'Web Server', 'Laptop', 'IoT Device'];
export const AUTH_RESULTS = ['Success', 'Failure', 'MFA Required', 'Account Locked', 'N/A'];
export const THREAT_CATEGORIES = [
  'None', 'Credential Attack', 'Network Reconnaissance', 'Malware', 
  'Web Attack', 'Insider Threat', 'Data Exfiltration', 'Privilege Abuse', 'Lateral Movement'
];
export const COUNTRIES = ['US', 'UK', 'DE', 'FR', 'CN', 'RU', 'IN', 'JP', 'BR', 'Unknown'];

const generateIp = (random: SeededRandom) => {
  return `${random.nextInt(1, 255)}.${random.nextInt(0, 255)}.${random.nextInt(0, 255)}.${random.nextInt(1, 254)}`;
};

export function generateSiemEvents(count: number, seed: number = 12345): SecurityEvent[] {
  const random = new SeededRandom(seed);
  const events: SecurityEvent[] = [];
  
  const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime(); // 7 days ago

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(startTime + random.nextRange(0, 7 * 24 * 60 * 60 * 1000)).toISOString();
    
    // Core selection
    const isAttack = random.next() < 0.15; // 15% of events are suspicious/attacks
    
    let eventType = '';
    let severity = '';
    let action = '';
    let threatCategory = '';
    let authResult = 'N/A';
    let protocol = random.pick(PROTOCOLS);

    if (isAttack) {
      const attackType = random.pick([
        'Brute Force', 'Malware Detection', 'SQL Injection Attempt', 
        'Data Exfiltration', 'Port Scan', 'Ransomware Indicator'
      ]);
      eventType = attackType;
      
      if (attackType === 'Brute Force') {
        severity = random.pickWeighted([{item: 'High', weight: 8}, {item: 'Critical', weight: 2}]);
        action = random.pickWeighted([{item: 'Block', weight: 7}, {item: 'Alert', weight: 3}]);
        threatCategory = 'Credential Attack';
        authResult = 'Failure';
        protocol = 'SSH';
      } else if (attackType === 'Malware Detection' || attackType === 'Ransomware Indicator') {
        severity = 'Critical';
        action = random.pickWeighted([{item: 'Quarantine', weight: 5}, {item: 'Terminate', weight: 4}, {item: 'Alert', weight: 1}]);
        threatCategory = 'Malware';
      } else if (attackType === 'SQL Injection Attempt') {
        severity = 'High';
        action = random.pickWeighted([{item: 'Block', weight: 9}, {item: 'Alert', weight: 1}]);
        threatCategory = 'Web Attack';
        protocol = 'HTTPS';
      } else if (attackType === 'Data Exfiltration') {
        severity = 'Critical';
        action = 'Alert';
        threatCategory = 'Data Exfiltration';
      } else if (attackType === 'Port Scan') {
        severity = 'Medium';
        action = 'Block';
        threatCategory = 'Network Reconnaissance';
      }
    } else {
      // Normal activity
      const normalType = random.pickWeighted([
        {item: 'Firewall Allow', weight: 40},
        {item: 'Login Success', weight: 30},
        {item: 'Failed Login', weight: 10},
        {item: 'Firewall Block', weight: 20}
      ]);
      eventType = normalType;
      
      if (normalType === 'Login Success') {
        severity = 'Informational';
        action = 'Allow';
        authResult = 'Success';
        threatCategory = 'None';
      } else if (normalType === 'Failed Login') {
        severity = 'Low';
        action = 'Alert';
        authResult = 'Failure';
        threatCategory = 'None';
      } else if (normalType === 'Firewall Allow') {
        severity = 'Informational';
        action = 'Allow';
        threatCategory = 'None';
      } else if (normalType === 'Firewall Block') {
        severity = 'Low';
        action = 'Block';
        threatCategory = 'None';
      }
    }

    const deviceType = random.pick(DEVICE_TYPES);
    const country = isAttack && random.next() > 0.5 ? random.pick(['RU', 'CN', 'Unknown']) : random.pick(COUNTRIES);
    const username = `user_${random.nextInt(1, 100)}`;
    
    events.push({
      id: i + 1,
      timestamp,
      sourceIp: generateIp(random),
      destinationIp: generateIp(random),
      sourcePort: random.nextInt(1024, 65535),
      destinationPort: random.pick([80, 443, 22, 53, 3306, 8080]),
      protocol,
      eventType,
      severity,
      action,
      status: random.pick(['Active', 'Closed', 'Investigating']),
      username,
      deviceType,
      country,
      authenticationResult: authResult,
      threatCategory,
      bytes: random.nextInt(64, 10000000),
      process: `proc_${random.nextInt(1, 50)}.exe`
    });
  }

  // Sort by timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // Reassign IDs after sorting
  return events.map((e, index) => ({ ...e, id: index + 1 }));
}
