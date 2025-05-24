import { memo } from 'react';
import NarrativeZone from './NarrativeZone';

const ZoneLayer = memo(({ 
  zones, 
  expandedZones, 
  highlightedZone,
  onToggleZone,
  onZoneHover 
}) => {
  if (!zones || zones.size === 0) return null;
  
  // Sort zones by size (larger zones rendered first)
  const sortedZones = Array.from(zones.entries()).sort((a, b) => {
    const areaA = (a[1].bounds?.width || 0) * (a[1].bounds?.height || 0);
    const areaB = (b[1].bounds?.width || 0) * (b[1].bounds?.height || 0);
    return areaB - areaA;
  });
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {sortedZones.map(([zoneId, zone]) => {
        if (!zone.bounds) return null;
        
        return (
          <NarrativeZone
            key={zoneId}
            zoneId={zoneId}
            zone={zone}
            bounds={zone.bounds}
            type={zone.type}
            title={zone.title}
            isExpanded={expandedZones.has(zoneId)}
            isHighlighted={highlightedZone === zoneId}
            onToggle={onToggleZone}
            memberCount={zone.members.size}
          />
        );
      })}
    </div>
  );
});

ZoneLayer.displayName = 'ZoneLayer';

export default ZoneLayer;
