/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

const INITIATIVES = [
  { lat: 9.03, lng: 38.74, name: "Addis Ababa: Growth Hub", color: "#3b82f6" },
  { lat: 51.5074, lng: -0.1278, name: "London: Research Center", color: "#2d6a4f" },
  { lat: 40.7128, lng: -74.0060, name: "New York: Strategic Office", color: "#3b82f6" },
  { lat: 1.3521, lng: 103.8198, name: "Singapore: Market Intelligence", color: "#2d6a4f" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney: Data Lab", color: "#3b82f6" },
  { lat: -23.5505, lng: -46.6333, name: "São Paulo: Project Dev", color: "#2d6a4f" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo: Innovation Wing", color: "#3b82f6" }
];

export const InteractiveGlobe = () => {
  const globeEl = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [isRotating, setIsRotating] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [atmosphereAlt, setAtmosphereAlt] = useState(0.15);

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = isRotating;
      controls.autoRotateSpeed = rotationSpeed;
    }
  }, [isRotating, rotationSpeed]);

  useEffect(() => {
    const handleResize = () => {
      const parent = document.getElementById('globe-container');
      if (parent) {
        setDimensions({
          width: parent.offsetWidth,
          height: parent.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Auto-rotate
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.pointOfView({ altitude: 2.5 }, 0);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div id="globe-container" className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg flex flex-col gap-3 text-white text-[10px] sm:text-xs w-36 sm:w-48 shadow-lg">
        <button 
          onClick={() => setIsRotating(!isRotating)}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition"
        >
          {isRotating ? "Pause Rotation" : "Resume Rotation"}
        </button>
        <label className="flex flex-col gap-1">
          Speed
          <input 
            type="range" min="0.1" max="2" step="0.1" value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          Atmosphere
          <input 
            type="range" min="0" max="0.5" step="0.05" value={atmosphereAlt}
            onChange={(e) => setAtmosphereAlt(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        pointsData={INITIATIVES}
        pointColor="color"
        pointAltitude={0.1}
        pointRadius={0.5}
        pointsMerge={true}
        pointLabel="name"
        onPointClick={(point: any) => {
           console.log(`Initiative: ${point.name}`);
        }}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={atmosphereAlt}
      />
    </div>
  );
};
