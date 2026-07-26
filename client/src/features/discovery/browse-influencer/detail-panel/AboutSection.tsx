import React from 'react';
import { Globe2, Info, Mail } from 'lucide-react';
import { InfluencerProfile } from '../types';
import { prettyPlace, titleCase, pfmt } from '../utils';
import { Metric } from '../common/Metric';

interface AboutSectionProps {
  profile: InfluencerProfile;
}

export const AboutSection = React.memo<AboutSectionProps>(({ profile }) => {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold mb-3">About & audience</h2>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <Globe2 className="h-4 w-4" /> 
          {prettyPlace(profile.country, profile.city, profile.state)}
        </div>
        
        <div className="text-gray-600">
          {profile.description || "—"}
        </div>
        
        {/* Interests */}
        {Array.isArray(profile.interests) && (profile.interests as any[]).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(profile.interests as any[]).slice(0, 8).map((interest: any, idx: number) => (
              <span 
                key={idx} 
                className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700"
              >
                {typeof interest === 'string' ? interest : (interest?.name || interest?.code || '')}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric small label="Age group" value={profile.ageGroup || "—"} />
        <Metric small label="Gender" value={titleCase(profile.gender)} />
        
        {typeof profile.audience?.notable === 'number' && (
          <Metric small label="Notable audience" value={pfmt(profile.audience?.notable)} />
        )}
        
        {typeof profile.audience?.credibility === 'number' && (
          <Metric small label="Credibility" value={pfmt(profile.audience?.credibility)} />
        )}
      </div>
      
      {/* Contact Info */}
      <div className="mt-4 text-xs text-gray-600">
        {profile.contacts && profile.contacts.length > 0 ? (
          <div className="space-y-1">
            {profile.contacts.slice(0, 3).map((contact, i) => (
              <div key={i} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="truncate">{contact.value}</span>
                {contact.type && (
                  <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-600">
                    {contact.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" /> 
            Contact details are locked. Reach out to enable them for free.
          </div>
        )}
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';