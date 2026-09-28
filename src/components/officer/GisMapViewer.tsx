import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  Layers, 
  Compass, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Info,
  MapPin,
  ExternalLink,
  Code,
  Play,
  Copy,
  Check,
  Ruler,
  Maximize,
  Download,
  Crosshair,
  Database,
  Globe,
  Sliders
} from 'lucide-react';
import { LandParcel } from '../../types';
import { 
  ST_Area, 
  ST_Perimeter, 
  ST_Distance, 
  ST_Centroid, 
  ST_AsText, 
  ST_AsGeoJSON, 
  ST_TransformToUTM43N, 
  ST_Contains, 
  ST_Buffer, 
  generatePostGisInsertSQL, 
  executePostGisQuery,
  PostGisQueryResult
} from '../../lib/postgis';

// Base tile providers for PostGIS visualization
const TILE_LAYERS = {
  STREETS: {
    name: 'OpenStreetMap (Cadastral)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  SATELLITE: {
    name: 'Esri World Imagery (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  TOPOGRAPHIC: {
    name: 'OpenTopoMap (Topography)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
  },
  CARTODB_LIGHT: {
    name: 'CartoDB Positron (High Contrast)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }
};

// Preset PostGIS SQL queries
const PRESET_QUERIES = [
  {
    id: 'q1',
    title: 'ST_Intersects: NH-48 60m RoW Corridor Intersection',
    sql: `SELECT parcel_id, survey_number, village, extent_ha, 
       ST_Area(geom::geography)/10000 AS postgis_area_ha,
       ST_Intersects(geom, ST_Buffer(highway_alignment::geography, 30)::geometry) AS in_corridor
FROM cadastral_parcels
WHERE ST_Intersects(geom, ST_Buffer(highway_alignment::geography, 30)::geometry);`
  },
  {
    id: 'q2',
    title: 'ST_Area & Geodesic Variance Validation',
    sql: `SELECT survey_number, extent_ha AS recorded_7_12_ha,
       ST_Area(geom::geography)/10000 AS st_area_geodesic_ha,
       ST_Perimeter(geom::geography) AS boundary_perimeter_m,
       ROUND((((ST_Area(geom::geography)/10000) - extent_ha) / extent_ha * 100)::numeric, 2) AS variance_pct
FROM cadastral_parcels;`
  },
  {
    id: 'q3',
    title: 'PostGIS ST_Transform: EPSG:4326 to UTM Zone 43N (EPSG:32643)',
    sql: `SELECT survey_number, village,
       ST_X(ST_Transform(ST_Centroid(geom), 32643)) AS utm_easting,
       ST_Y(ST_Transform(ST_Centroid(geom), 32643)) AS utm_northing,
       ST_AsText(geom) AS wkt_polygon
FROM cadastral_parcels;`
  },
  {
    id: 'q4',
    title: 'Filter High Delay Risk Parcels (AI p >= 0.75)',
    sql: `SELECT p.survey_number, p.village, c.risk_band,
       ST_X(ST_Centroid(p.geom)) AS centroid_lng,
       ST_Y(ST_Centroid(p.geom)) AS centroid_lat,
       'ST_Polygon' AS geometry_type
FROM cadastral_parcels p
JOIN acquisition_cases c ON p.case_id = c.id
WHERE c.risk_probability >= 0.75;`
  }
];

export const GisMapViewer: React.FC<{ onSelectCase?: (caseId: string) => void }> = ({ onSelectCase }) => {
  const { cases, language, setSelectedCaseId, isDarkMode } = useApp();
  
  // UI & Active State
  const [selectedParcel, setSelectedParcel] = useState<(LandParcel & { caseId: string; caseReference: string; projectName: string; riskBand: string; riskProbability: number }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTileLayerKey, setActiveTileLayerKey] = useState<keyof typeof TILE_LAYERS>('STREETS');
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [showRowCorridor, setShowRowCorridor] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAP' | 'POSTGIS_SQL' | 'GEOMETRY_INSPECTOR'>('MAP');
  
  // PostGIS SQL State
  const [sqlInput, setSqlInput] = useState(PRESET_QUERIES[0].sql);
  const [queryResult, setQueryResult] = useState<PostGisQueryResult | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Measurement Tools
  const [measureMode, setMeasureMode] = useState<'NONE' | 'DISTANCE' | 'AREA'>('NONE');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const parcelLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const corridorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const measureLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const queryHighlightGroupRef = useRef<L.LayerGroup | null>(null);

  // Flatten all parcels with case context
  const allParcelsWithCase = useMemo(() => {
    return cases.flatMap(c => 
      c.parcels.map(p => ({
        ...p,
        caseId: c.id,
        caseReference: c.caseReference,
        projectName: c.projectName,
        stage: c.stage,
        riskBand: c.riskBand,
        riskProbability: c.riskProbability,
      }))
    );
  }, [cases]);

  // Highway Alignment Coordinates (WGS 84 EPSG:4326)
  const highwayAlignment: [number, number][] = useMemo(() => [
    [18.3810, 73.8860],
    [18.3835, 73.8895],
    [18.3855, 73.8930],
    [18.3878, 73.8965],
    [18.3905, 73.9010],
    [18.3930, 73.9050],
  ], []);

  // PostGIS features representation for spatial queries
  const postGisFeatures = useMemo(() => {
    return allParcelsWithCase.map(p => ({
      id: p.id,
      surveyNumber: p.surveyNumber,
      village: p.village,
      classification: p.classification,
      extentHa: p.extent,
      riskBand: p.riskBand,
      caseReference: p.caseReference,
      coordinates: p.coordinates,
      srid: 4326
    }));
  }, [allParcelsWithCase]);

  // Filtered parcels based on search
  const filteredParcels = useMemo(() => {
    if (!searchQuery.trim()) return allParcelsWithCase;
    const q = searchQuery.toLowerCase();
    return allParcelsWithCase.filter(p => 
      p.surveyNumber.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q) ||
      p.caseReference.toLowerCase().includes(q)
    );
  }, [allParcelsWithCase, searchQuery]);

  // Initial Selected Parcel
  useEffect(() => {
    if (allParcelsWithCase.length > 0 && !selectedParcel) {
      setSelectedParcel(allParcelsWithCase[0]);
    }
  }, [allParcelsWithCase, selectedParcel]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [18.3855, 73.8940];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Top-Left Zoom Controls
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // Add Base Tile Layer
    const tileConfig = TILE_LAYERS[activeTileLayerKey];
    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      attribution: tileConfig.attribution
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer Groups
    parcelLayerGroupRef.current = L.layerGroup().addTo(map);
    corridorLayerGroupRef.current = L.layerGroup().addTo(map);
    measureLayerGroupRef.current = L.layerGroup().addTo(map);
    queryHighlightGroupRef.current = L.layerGroup().addTo(map);

    // Mouse Move & Click Listeners for Coordinates & Measurement
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6))
      });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      // If measurement mode is active
      if (measureMode === 'DISTANCE' || measureMode === 'AREA') {
        setMeasurePoints(prev => [...prev, clickPoint]);
        return;
      }

      // Point-in-polygon ST_Contains lookup
      const found = allParcelsWithCase.find(p => ST_Contains(p.coordinates, clickPoint));
      if (found) {
        setSelectedParcel(found);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_LAYERS[activeTileLayerKey];
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      attribution: tileConfig.attribution
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTileLayer;
  }, [activeTileLayerKey]);

  // Render PostGIS Parcel Polygons on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !parcelLayerGroupRef.current) return;
    parcelLayerGroupRef.current.clearLayers();

    filteredParcels.forEach(parcel => {
      const isSelected = selectedParcel?.id === parcel.id;
      
      // Color palette based on PostGIS risk shading
      let fillColor = '#3b82f6'; // Blue default
      let strokeColor = '#1d4ed8';

      if (showRiskOverlay) {
        if (parcel.riskBand === 'CRITICAL' || parcel.riskProbability >= 0.75) {
          fillColor = '#dc2626'; // Red
          strokeColor = '#991b1b';
        } else if (parcel.riskBand === 'HIGH') {
          fillColor = '#f59e0b'; // Amber
          strokeColor = '#b45309';
        } else {
          fillColor = '#10b981'; // Emerald
          strokeColor = '#047857';
        }
      }

      if (isSelected) {
        strokeColor = '#38bdf8'; // Cyan highlight border
      }

      const polygon = L.polygon(parcel.coordinates, {
        color: strokeColor,
        weight: isSelected ? 4 : 2,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.65 : 0.4,
        dashArray: isSelected ? undefined : '2, 4'
      });

      // Centroid marker with Gat label
      const centroid = ST_Centroid(parcel.coordinates);
      const computedAreaHa = (ST_Area(parcel.coordinates) / 10000).toFixed(2);
      
      polygon.bindTooltip(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: #1e3a8a;">${parcel.surveyNumber}</strong> (${parcel.village})<br/>
          <span>7/12: ${parcel.extent} Ha | PostGIS: ${computedAreaHa} Ha</span><br/>
          <span style="font-weight: 700; color: ${parcel.riskBand === 'CRITICAL' ? '#b91c1c' : '#047857'};">
            Risk: ${parcel.riskBand} (${Math.round(parcel.riskProbability * 100)}%)
          </span>
        </div>
      `, {
        permanent: false,
        direction: 'center',
        className: 'cadastral-tooltip'
      });

      polygon.on('click', () => {
        setSelectedParcel(parcel);
      });

      polygon.addTo(parcelLayerGroupRef.current!);

      // Centroid icon tag
      const iconHtml = `
        <div style="
          background-color: ${isSelected ? '#0284c7' : '#1e293b'};
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 9999px;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          white-space: nowrap;
          text-align: center;
        ">
          ${parcel.surveyNumber.replace('Gat No. ', '')}
        </div>
      `;

      const divIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-centroid-icon',
        iconSize: [40, 20],
        iconAnchor: [20, 10]
      });

      L.marker(centroid, { icon: divIcon, interactive: false }).addTo(parcelLayerGroupRef.current!);
    });
  }, [filteredParcels, selectedParcel, showRiskOverlay]);

  // Render PostGIS RoW Corridor (Centerline + ST_Buffer polygon)
  useEffect(() => {
    if (!mapInstanceRef.current || !corridorLayerGroupRef.current) return;
    corridorLayerGroupRef.current.clearLayers();

    if (!showRowCorridor) return;

    // 1. PostGIS ST_Buffer(highway_alignment, 30m) 60m Corridor Polygon
    const bufferCoords = ST_Buffer(highwayAlignment, 30);
    if (bufferCoords.length > 0) {
      L.polygon(bufferCoords, {
        color: '#f59e0b',
        weight: 1.5,
        fillColor: '#fbbf24',
        fillOpacity: 0.22,
        dashArray: '4, 6'
      }).bindTooltip('PostGIS ST_Buffer(ROW_Centerline, 30m) - 60m Statutory Acquisition Corridor', {
        permanent: false,
        sticky: true
      }).addTo(corridorLayerGroupRef.current);
    }

    // 2. Highway Alignment Centerline
    L.polyline(highwayAlignment, {
      color: '#ffffff',
      weight: 3,
      dashArray: '8, 8',
      opacity: 0.95
    }).addTo(corridorLayerGroupRef.current);

    L.polyline(highwayAlignment, {
      color: '#d97706',
      weight: 8,
      opacity: 0.5
    }).addTo(corridorLayerGroupRef.current);
  }, [showRowCorridor, highwayAlignment]);

  // Render Dynamic Measurement Overlay
  useEffect(() => {
    if (!mapInstanceRef.current || !measureLayerGroupRef.current) return;
    measureLayerGroupRef.current.clearLayers();

    if (measurePoints.length === 0) return;

    // Plot vertex markers
    measurePoints.forEach((pt, idx) => {
      L.circleMarker(pt, {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1
      }).bindTooltip(`Vertex ${idx + 1}`, { permanent: true, direction: 'top' })
        .addTo(measureLayerGroupRef.current!);
    });

    // Distance Line
    if (measureMode === 'DISTANCE' && measurePoints.length >= 2) {
      L.polyline(measurePoints, {
        color: '#3b82f6',
        weight: 3,
        dashArray: '6, 6'
      }).addTo(measureLayerGroupRef.current);
    }

    // Area Polygon
    if (measureMode === 'AREA' && measurePoints.length >= 3) {
      L.polygon(measurePoints, {
        color: '#8b5cf6',
        weight: 2,
        fillColor: '#a78bfa',
        fillOpacity: 0.4
      }).addTo(measureLayerGroupRef.current);
    }
  }, [measurePoints, measureMode]);

  // Handle Query Highlights
  useEffect(() => {
    if (!mapInstanceRef.current || !queryHighlightGroupRef.current) return;
    queryHighlightGroupRef.current.clearLayers();

    if (!queryResult || !queryResult.spatialHighlightIds) return;

    // Highlight matching parcels
    const matched = allParcelsWithCase.filter(p => queryResult.spatialHighlightIds?.includes(p.id));
    matched.forEach(p => {
      L.polygon(p.coordinates, {
        color: '#38bdf8',
        weight: 4,
        fillColor: '#0284c7',
        fillOpacity: 0.35,
        dashArray: '5, 5'
      }).addTo(queryHighlightGroupRef.current!);
    });

    // Render any derived geometries from query (e.g. ST_Buffer)
    if (queryResult.derivedGeometries) {
      queryResult.derivedGeometries.forEach(dg => {
        if (dg.type === 'Polygon') {
          L.polygon(dg.coordinates, {
            color: dg.color,
            weight: 3,
            fillColor: dg.color,
            fillOpacity: 0.25
          }).bindTooltip(dg.label, { permanent: true, direction: 'center' })
            .addTo(queryHighlightGroupRef.current!);
        }
      });
    }
  }, [queryResult, allParcelsWithCase]);

  // Recenter map on selected parcel
  const handleRecenterOnParcel = (parcel: LandParcel) => {
    if (!mapInstanceRef.current) return;
    const centroid = ST_Centroid(parcel.coordinates);
    mapInstanceRef.current.flyTo(centroid, 17, { duration: 1.2 });
  };

  // Run PostGIS Query
  const handleExecuteQuery = () => {
    setIsExecutingQuery(true);
    setTimeout(() => {
      const res = executePostGisQuery(sqlInput, postGisFeatures, highwayAlignment);
      setQueryResult(res);
      setIsExecutingQuery(false);
    }, 180);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Selected Parcel PostGIS calculations
  const selectedParcelStats = useMemo(() => {
    if (!selectedParcel) return null;
    const geodesicAreaSqM = ST_Area(selectedParcel.coordinates);
    const geodesicAreaHa = Number((geodesicAreaSqM / 10000).toFixed(4));
    const perimeterM = ST_Perimeter(selectedParcel.coordinates);
    const centroid = ST_Centroid(selectedParcel.coordinates);
    const utm = ST_TransformToUTM43N(centroid[0], centroid[1]);
    const wkt = ST_AsText(selectedParcel.coordinates, 'POLYGON', 4326);
    const geojson = ST_AsGeoJSON(selectedParcel.coordinates, {
      surveyNumber: selectedParcel.surveyNumber,
      village: selectedParcel.village,
      extentHa: selectedParcel.extent,
      riskBand: selectedParcel.riskBand
    });
    const insertSQL = generatePostGisInsertSQL(selectedParcel);

    // Variance with recorded 7/12
    const variancePct = Number((((geodesicAreaHa - selectedParcel.extent) / selectedParcel.extent) * 100).toFixed(2));

    return {
      geodesicAreaSqM,
      geodesicAreaHa,
      perimeterM,
      centroid,
      utm,
      wkt,
      geojson,
      insertSQL,
      variancePct
    };
  }, [selectedParcel]);

  // Measurement computed totals
  const measurementStats = useMemo(() => {
    if (measureMode === 'DISTANCE' && measurePoints.length >= 2) {
      const distM = ST_Perimeter(measurePoints);
      return {
        type: 'DISTANCE',
        valueMeters: distM,
        valueKm: (distM / 1000).toFixed(3),
        pointsCount: measurePoints.length
      };
    }
    if (measureMode === 'AREA' && measurePoints.length >= 3) {
      const areaSqM = ST_Area(measurePoints);
      return {
        type: 'AREA',
        valueSqM: areaSqM,
        valueHa: (areaSqM / 10000).toFixed(4),
        valueAcres: (areaSqM / 4046.86).toFixed(3),
        pointsCount: measurePoints.length
      };
    }
    return null;
  }, [measureMode, measurePoints]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in">
      {/* Top Header & View Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200">
              PostGIS 3.4 / GEOS Spatial Engine
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-200">
              EPSG:4326 (WGS 84) & EPSG:32643 (UTM 43N)
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <MapIcon className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            {language === 'en' ? 'PostGIS Cadastral GIS & Spatial Coordinate Engine' : 'पोस्टजीआईएस कैडस्ट्रल भू-नक्शा एवं स्थानिक निर्देशांक प्रणाली'}
          </h2>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'MAP'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Interactive GIS Map' : 'संवादात्मक नक्शा'}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('POSTGIS_SQL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'POSTGIS_SQL'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'PostGIS SQL Console' : 'पोस्टजीआईएस एसक्यूएल'}</span>
          </button>

          <button
            onClick={() => setActiveTab('GEOMETRY_INSPECTOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'GEOMETRY_INSPECTOR'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'WKT / GeoJSON Inspector' : 'डब्ल्यूकेटी / जियोजेसन'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Tab */}
      {activeTab === 'MAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View Canvas (2 Columns) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Map Toolbar Controls */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Search Gat / Survey */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Filter Gat No / Village...' : 'सर्वे गट / ग्राम खोजें...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
                />
              </div>

              {/* Base Tile Layer Switcher */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">{language === 'en' ? 'Layer:' : 'परत:'}</span>
                <select
                  value={activeTileLayerKey}
                  onChange={(e) => setActiveTileLayerKey(e.target.value as keyof typeof TILE_LAYERS)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="STREETS">OpenStreetMap Cadastral</option>
                  <option value="SATELLITE">Esri Satellite Imagery</option>
                  <option value="CARTODB_LIGHT">CartoDB Positron</option>
                  <option value="TOPOGRAPHIC">OpenTopoMap</option>
                </select>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRiskOverlay(!showRiskOverlay)}
                  className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                    showRiskOverlay 
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 text-slate-600'
                  }`}
                  title="Toggle AI Delay Risk Color Coding"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>AI Risk Layer</span>
                </button>

                <button
                  onClick={() => setShowRowCorridor(!showRowCorridor)}
                  className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 transition-colors ${
                    showRowCorridor 
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200' 
                      : 'bg-white dark:bg-slate-800 border-slate-300 text-slate-600'
                  }`}
                  title="Toggle PostGIS 60m RoW Alignment Buffer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>60m RoW Corridor</span>
                </button>
              </div>

              {/* Measurement Mode Controls */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setMeasureMode(measureMode === 'DISTANCE' ? 'NONE' : 'DISTANCE');
                    setMeasurePoints([]);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    measureMode === 'DISTANCE'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title="Measure Geodesic Distance with PostGIS ST_Distance"
                >
                  <Ruler className="w-3 h-3" />
                  <span>Distance</span>
                </button>

                <button
                  onClick={() => {
                    setMeasureMode(measureMode === 'AREA' ? 'NONE' : 'AREA');
                    setMeasurePoints([]);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    measureMode === 'AREA'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title="Measure Geodesic Polygon Area with PostGIS ST_Area"
                >
                  <Maximize className="w-3 h-3" />
                  <span>Area</span>
                </button>

                {measureMode !== 'NONE' && (
                  <button
                    onClick={() => {
                      setMeasureMode('NONE');
                      setMeasurePoints([]);
                    }}
                    className="px-2 py-1 text-[10px] text-red-600 font-bold hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Active Measurement HUD Banner */}
            {measureMode !== 'NONE' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>
                    <strong>{measureMode === 'DISTANCE' ? 'ST_Distance Ruler Active' : 'ST_Area Polygon Measurer Active'}:</strong> Click on map to add vertices.
                  </span>
                </div>
                {measurementStats && (
                  <div className="font-mono font-bold text-blue-900 dark:text-blue-200">
                    {measurementStats.type === 'DISTANCE' && (
                      <span>Total Geodesic Length: {measurementStats.valueMeters} m ({measurementStats.valueKm} km)</span>
                    )}
                    {measurementStats.type === 'AREA' && (
                      <span>PostGIS Geodesic Area: {measurementStats.valueHa} Ha ({measurementStats.valueSqM.toLocaleString()} m² / {measurementStats.valueAcres} Acres)</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Leaflet Map Stage Container */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative h-[520px]">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Map Footer Coordinate Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 shadow-lg pointer-events-auto">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                    Live Cursor (EPSG:4326):
                  </span>
                  <span className="font-mono text-emerald-400">
                    {cursorCoords ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E` : 'Hover map...'}
                  </span>
                  {cursorCoords && (
                    <span className="hidden sm:inline font-mono text-slate-400 text-[11px]">
                      UTM 43N: E {ST_TransformToUTM43N(cursorCoords.lat, cursorCoords.lng).easting}m, N {ST_TransformToUTM43N(cursorCoords.lat, cursorCoords.lng).northing}m
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> High</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Low</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400/40 border border-amber-400 inline-block"></span> 60m RoW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 1 Column: Selected Cadastral Parcel PostGIS Inspector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  {language === 'en' ? 'Cadastral Spatial Record' : 'कैडस्ट्रल स्थानिक विवरण'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedParcel ? selectedParcel.surveyNumber : 'Click any polygon on map to inspect'}
                </p>
              </div>
              {selectedParcel && (
                <button
                  onClick={() => handleRecenterOnParcel(selectedParcel)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600"
                  title="Fly to Parcel"
                >
                  <Compass className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedParcel && selectedParcelStats ? (
              <div className="space-y-4 text-xs">
                {/* Cadastral Basic Info Box */}
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Survey Gat:</span>
                    <strong className="text-blue-900 dark:text-blue-200 font-mono text-sm">{selectedParcel.surveyNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Village / Tehsil:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedParcel.village}, {selectedParcel.tehsil}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Classification:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedParcel.classification}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">7/12 Land Record:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{selectedParcel.extent} {selectedParcel.extentUnit}</strong>
                  </div>
                </div>

                {/* PostGIS Geodesic Area & Geometry Card */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      PostGIS Geodesic Calculation:
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      Math.abs(selectedParcelStats.variancePct) <= 1.0 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                    }`}>
                      Δ {selectedParcelStats.variancePct > 0 ? `+${selectedParcelStats.variancePct}%` : `${selectedParcelStats.variancePct}%`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">ST_Area(geog):</span>
                      <strong>{selectedParcelStats.geodesicAreaHa} Ha</strong>
                      <span className="text-slate-400 block text-[9px]">({selectedParcelStats.geodesicAreaSqM.toLocaleString()} m²)</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">ST_Perimeter:</span>
                      <strong>{selectedParcelStats.perimeterM} m</strong>
                      <span className="text-slate-400 block text-[9px]">(Boundary)</span>
                    </div>
                  </div>

                  {/* Centroid Coordinates (WGS84 & UTM) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Centroid (4326):</span>
                      <span className="text-slate-800 dark:text-slate-200">{selectedParcelStats.centroid[0]}° N, {selectedParcelStats.centroid[1]}° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">UTM 43N (32643):</span>
                      <span className="text-slate-800 dark:text-slate-200">E {selectedParcelStats.utm.easting} | N {selectedParcelStats.utm.northing}</span>
                    </div>
                  </div>
                </div>

                {/* Case Link */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Associated Case:</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{selectedParcel.caseReference}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Project:</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{selectedParcel.projectName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">AI Risk Band:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedParcel.riskBand === 'CRITICAL' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : selectedParcel.riskBand === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {selectedParcel.riskBand} ({Math.round(selectedParcel.riskProbability * 100)}%)
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCaseId(selectedParcel.caseId);
                      if (onSelectCase) onSelectCase(selectedParcel.caseId);
                    }}
                    className="mt-2 w-full py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>{language === 'en' ? 'Open Case Workspace' : 'मामला कार्यस्थान खोलें'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Compass className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p>{language === 'en' ? 'Select any polygon parcel on the map to inspect PostGIS coordinates.' : 'नक्शे पर किसी भी भूखंड का चयन करें।'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PostGIS SQL Console Tab */}
      {activeTab === 'POSTGIS_SQL' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-700" />
                  {language === 'en' ? 'PostGIS Spatial Query Console' : 'पोस्टजीआईएस स्थानिक क्वेरी कंसोल'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'en'
                    ? 'Execute spatial SQL queries using ST_Intersects, ST_Buffer, ST_Area, ST_Distance and ST_Transform on cadastral geometries.'
                    : 'भूखंडों पर स्थानिक एसक्यूएल क्वेरी निष्पादित करें।'}
                </p>
              </div>

              {/* Sample Queries Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Preset Queries:</span>
                <select
                  onChange={(e) => {
                    const found = PRESET_QUERIES.find(q => q.id === e.target.value);
                    if (found) setSqlInput(found.sql);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  {PRESET_QUERIES.map(pq => (
                    <option key={pq.id} value={pq.id}>{pq.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SQL Editor Area */}
            <div className="relative font-mono text-xs">
              <textarea
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                rows={5}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                placeholder="SELECT ... FROM cadastral_parcels WHERE ST_Intersects(...);"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={() => handleCopy(sqlInput, 'sql_input')}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                  title="Copy SQL"
                >
                  {copiedCode === 'sql_input' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleExecuteQuery}
                  disabled={isExecutingQuery}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecutingQuery ? 'Executing...' : 'Run Spatial Query'}</span>
                </button>
              </div>
            </div>

            {/* Query Results Table */}
            {queryResult && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Query Output:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {queryResult.rowCount} rows returned in {queryResult.executionTimeMs} ms
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Index Scan: idx_parcels_geom_gist
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        {queryResult.columns.map(col => (
                          <th key={col} className="px-3 py-2 font-bold uppercase">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {queryResult.columns.map(col => (
                            <td key={col} className="px-3 py-2 whitespace-nowrap">
                              {typeof row[col] === 'boolean' 
                                ? (row[col] ? <span className="text-emerald-600 font-bold">TRUE</span> : <span className="text-red-600 font-bold">FALSE</span>)
                                : String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Geometry Inspector Tab (WKT, GeoJSON, PostGIS INSERT) */}
      {activeTab === 'GEOMETRY_INSPECTOR' && selectedParcel && selectedParcelStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PostGIS Well-Known Text (WKT) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <span>PostGIS Well-Known Text (WKT - SRID 4326)</span>
              </h3>
              <button
                onClick={() => handleCopy(selectedParcelStats.wkt, 'wkt')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1"
              >
                {copiedCode === 'wkt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy WKT</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
              {selectedParcelStats.wkt}
            </pre>
          </div>

          {/* PostGIS SQL INSERT Statement */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                <span>PostGIS SQL DML Statement</span>
              </h3>
              <button
                onClick={() => handleCopy(selectedParcelStats.insertSQL, 'insert_sql')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1"
              >
                {copiedCode === 'insert_sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy SQL</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
              {selectedParcelStats.insertSQL}
            </pre>
          </div>

          {/* GeoJSON Polygon Output */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>GeoJSON Feature Structure (RFC 7946)</span>
              </h3>
              <button
                onClick={() => handleCopy(JSON.stringify(selectedParcelStats.geojson, null, 2), 'geojson')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1"
              >
                {copiedCode === 'geojson' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy GeoJSON</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-purple-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed max-h-64">
              {JSON.stringify(selectedParcelStats.geojson, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
