"use client";
import { useSiemStore } from '@/store/useSiemStore';
import { ShieldAlert, Crosshair, Network, FileLock, UserX } from 'lucide-react';

export function InvestigationPanel() {
  const { setCurrentQuery, setActiveTab } = useSiemStore();

  const handleLaunch = (query: string) => {
    setCurrentQuery(query);
    setActiveTab('Query');
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white mb-4">Threat Investigation Scenarios</h2>
      <p className="text-neutral-400 max-w-2xl text-sm">
        Click a scenario below to automatically populate the Query Builder with a predefined bitmap execution strategy for common security incidents.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        
        <ScenarioCard 
          icon={<ShieldAlert className="w-8 h-8 text-red-500" />}
          title="Critical Firewall Blocks"
          desc="Identify all events where the firewall blocked critical severity traffic."
          query="severity = 'Critical'\nAND action = 'Block'"
          onLaunch={() => handleLaunch("severity = 'Critical'\nAND action = 'Block'")}
          color="border-red-500/30 hover:border-red-500"
        />

        <ScenarioCard 
          icon={<UserX className="w-8 h-8 text-amber-500" />}
          title="Brute Force Campaign"
          desc="Locate failed authentication attempts associated with brute force tactics."
          query="eventType IN ('Failed Login', 'Brute Force')\nAND authenticationResult = 'Failure'"
          onLaunch={() => handleLaunch("eventType IN ('Failed Login', 'Brute Force')\nAND authenticationResult = 'Failure'")}
          color="border-amber-500/30 hover:border-amber-500"
        />

        <ScenarioCard 
          icon={<Network className="w-8 h-8 text-blue-500" />}
          title="Suspicious SSH Activity"
          desc="Monitor high or critical severity events occurring over SSH."
          query="protocol = 'SSH'\nAND severity IN ('High', 'Critical')"
          onLaunch={() => handleLaunch("protocol = 'SSH'\nAND severity IN ('High', 'Critical')")}
          color="border-blue-500/30 hover:border-blue-500"
        />

        <ScenarioCard 
          icon={<FileLock className="w-8 h-8 text-purple-500" />}
          title="Malware Incident"
          desc="Find events categorized as Malware that have reached critical severity."
          query="threatCategory = 'Malware'\nAND severity = 'Critical'"
          onLaunch={() => handleLaunch("threatCategory = 'Malware'\nAND severity = 'Critical'")}
          color="border-purple-500/30 hover:border-purple-500"
        />

        <ScenarioCard 
          icon={<Crosshair className="w-8 h-8 text-emerald-500" />}
          title="Targeted Web Attack"
          desc="Investigate suspected SQL Injection or XSS attacks that were allowed through."
          query="eventType IN ('SQL Injection Attempt', 'XSS Attempt')\nAND action = 'Allow'"
          onLaunch={() => handleLaunch("eventType IN ('SQL Injection Attempt', 'XSS Attempt')\nAND action = 'Allow'")}
          color="border-emerald-500/30 hover:border-emerald-500"
        />

      </div>
    </div>
  );
}

interface ScenarioCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  query: string;
  onLaunch: () => void;
  color: string;
}

function ScenarioCard({ icon, title, desc, query, onLaunch, color }: ScenarioCardProps) {
  return (
    <div className={`bg-neutral-900 border rounded-lg p-6 flex flex-col transition-colors cursor-pointer ${color}`} onClick={onLaunch}>
      <div className="mb-4 bg-neutral-950/50 w-16 h-16 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 mb-4 flex-1">{desc}</p>
      
      <div className="bg-neutral-950 rounded p-3 text-xs font-mono text-neutral-500 mb-4 whitespace-pre-wrap">
        {query}
      </div>

      <button className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm font-bold transition-colors">
        Investigate
      </button>
    </div>
  );
}
