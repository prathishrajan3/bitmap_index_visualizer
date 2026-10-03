import React from 'react';
import { User, Code, GraduationCap, Award } from 'lucide-react';

export function DeveloperInfo() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 mt-4">
      {/* Header */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <Code className="w-64 h-64 text-blue-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Developed By</h1>
        <p className="text-neutral-400 text-lg">
          Project Developer Information and Acknowledgements
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Information */}
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 relative">
          <div className="absolute top-6 right-6 w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-200 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            Student Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Student Name</p>
              <p className="text-xl text-white font-medium">G Prathish Rajan</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Register Number</p>
              <p className="text-xl text-blue-400 font-mono">25BCE5367</p>
            </div>
          </div>
        </div>

        {/* Guide Information */}
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 relative">
          <div className="absolute top-6 right-6 w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-200 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            Guided By
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Project Guide</p>
              <p className="text-xl text-white font-medium">Dr. Swaminathan A</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Designation</p>
              <p className="text-lg text-emerald-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Assistant Professor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
