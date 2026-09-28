# BHUMISETU — Dataset Requirements & Integration Specification

This document details the comprehensive dataset requirements, schemas, spatial specifications, and official government data sources required to power all functional modules of the **BHUMISETU Land Acquisition Management & Decision Support Platform** (under the *Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013* - RFCTLARR 2013).

---

## 1. Executive Summary: Core Modules & Data Feeds

| # | System Feature / Module | Primary Dataset Needed | Format / Standard | Official Source Agency / Portal |
|---|---|---|---|---|
| **1** | **PostGIS Cadastral GIS & Spatial Engine** | Cadastral Parcel Boundary Maps (Gat/Khasra Polygons) | GeoJSON, Shapefile, PostGIS WKT (EPSG:4326 / EPSG:32643) | **BhuNaksha (NIC)** / **Mahabhumi** |
| **2** | **Cadastral RoR (Record of Rights)** | 7/12 Extracts, Mutation Registers (Ferfar), 8A Holdings | JSON, XML, REST API | **Mahabhulekh** / **DILRMP** (DoLR) |
| **3** | **Right-of-Way (RoW) Infrastructure Alignments** | Linear Project Corridor Alignments (Centrelines & Buffers) | GeoJSON, KML, OGC WMS/WFS | **PM GatiShakti NMP** / **NHAI Data Lake (DAKSH)** |
| **4** | **Document OCR & Devanagari 7/12 Digitizer** | Scanned 7/12 Land Records & Certified Mutation Forms | High-Res PDF, TIFF, PNG (300 DPI) | **IGR Maharashtra** / **Revenue Dept Archive** |
| **5** | **AI Delay Risk & Survival Prediction Engine** | Historical RFCTLARR Statutory Timeline Case Registries | CSV, Parquet, Tabular DB | **RFCTLARR MIS (DoLR)** / **District Gazetteers** |
| **6** | **Ready Reckoner / ASR Circle Rate Valuation** | Annual Statement of Rates (ASR), Circle Rates, Market Multipliers | Structured JSON, CSV | **Department of Registration & Stamps (IGR)** |
| **7** | **Section 15 Objections & Land Dispute Registry** | Revenue Court Cases, Injunctions, Title Disputes | REST API, JSON | **RCCMS (Revenue Court Case Mgmt)** / **e-Courts** |
| **8** | **PFMS Statutory Compensation Disbursement** | Treasury Beneficiary Accounts, e-Kuber Payment Logs | ISO 20022 XML, Direct API | **Public Financial Management System (PFMS)** |
| **9** | **DPDP Act 2023 Audit & Retention Engine** | User Consent Logs, Citizen DSR Requests, Access Trails | Encrypted JSON, Append-Only Log | **Internal BHUMISETU System Store** |

---

## 2. Detailed Feature-by-Feature Dataset Specifications

### 2.1 PostGIS Cadastral GIS & Spatial Coordinate Engine
* **Purpose**: Renders cadastral boundaries, calculates geodesic areas (`ST_Area`), checks spatial intersections (`ST_Intersects`) with Right-of-Way (RoW) buffer zones (`ST_Buffer`), and projects between WGS 84 (EPSG:4326) and UTM Zone 43N (EPSG:32643).
* **Required Attributes**:
  - `parcel_id`: Unique Cadastral Parcel Identifier (ULPIN - Unique Land Parcel Identification Number, 14-digit alphanumeric)
  - `survey_gat_no`: Official Survey / Gat Number
  - `village_code`: Census / LGD (Local Government Directory) Village Code
  - `tehsil_code` & `district_code`: Administrative boundary hierarchy
  - `geom`: Polygon / MultiPolygon spatial geometry with SRID 4326
  - `geodesic_area_sqm`: PostGIS-computed land area
* **Official Website / Source**:
  - **Portal**: [BhuNaksha - Cadastral Mapping Solution by NIC](https://bhunaksha.nic.in/)
  - **State Portal (Maharashtra)**: [Mahabhumi BhuNaksha Portal](https://mahabhunaksha.mahabhumi.gov.in/)
  - **National Geoportal**: [Survey of India Online Map Portal](https://onlinemaps.surveyofindia.gov.in/) / [Bharat Maps (NIC)](https://bharatmaps.gov.in/)

---

### 2.2 Land Records, RoR & Ownership Verification (7/12 & 8A Extracts)
* **Purpose**: Validates land classification (Jirayat/Bagayat/Potkharab), ownership shares (summing strictly to 1.0000), encumbrances, and tenancy claims.
* **Required Attributes**:
  - `khata_number`: Record of Right (RoR) ledger account number
  - `owner_names`: Primary and co-owner names (English and Regional script)
  - `share_ratio`: Fractional co-ownership share (e.g., 0.5000, 0.2500)
  - `land_use_classification`: Dry Crop (*Jirayat*), Perennially Irrigated (*Bagayat*), Uncultivable (*Potkharab*), Non-Agricultural (*NA*)
  - `potkharab_area`: Uncultivable area deducted from compensation computation
  - `encumbrances`: Bank hypothecations, mortgage charges, court attachments (*Bojha*)
* **Official Website / Source**:
  - **Portal**: [Mahabhulekh (Maharashtra Bhumi Abhilekh)](https://bhulekh.mahabhumi.gov.in/)
  - **National Portal**: [Digital India Land Records Modernization Programme (DILRMP)](https://dilrmp.gov.in/)
  - **Open Government Data (OGD) Platform**: [Data.gov.in - Land Resources](https://data.gov.in/)

---

### 2.3 PM GatiShakti Infrastructure Corridor Alignment & RoW Datasets
* **Purpose**: Ingests proposed linear infrastructure centerlines (expressways, freight corridors, railway bypasses, metro lines) to compute statutory land acquisition buffers (30m to 60m RoW).
* **Required Attributes**:
  - `project_id`: Central / State Infrastructure Project Code
  - `corridor_name`: e.g., "Pune-Bengaluru Industrial Corridor (NH-48)"
  - `alignment_geometry`: GeoJSON LineString / MultiLineString coordinates
  - `row_width_meters`: Statutory Right-of-Way width (e.g., 45m, 60m)
  - `chainage_start_km` & `chainage_end_km`: Linear milestone references
* **Official Website / Source**:
  - **Portal**: [PM GatiShakti National Master Plan Portal](https://www.gatispirit.in/) / [BISAG-N (Bhaskaracharya National Institute for Space Applications and Geo-informatics)](https://bisag-n.gov.in/)
  - **NHAI Portal**: [National Highways Authority of India (NHAI)](https://nhai.gov.in/) / [NHAI DAKSH Land Acquisition Portal](https://daksh.nhai.org/)
  - **Ministry**: [Ministry of Road Transport and Highways (MoRTH)](https://morth.nic.in/)

---

### 2.4 Annual Statement of Rates (ASR) / Circle Rates Valuation Registry
* **Purpose**: Powers statutory compensation determination under Section 26 to 30 of RFCTLARR 2013 (Base Land Rate × Rural Multiplier 1.0–2.0 + 100% Solatium + 12% Additional Market Value).
* **Required Attributes**:
  - `revenue_zone`: Village / Urban sub-zone ID
  - `land_category`: Agricultural (Dry/Wet), Commercial, Industrial, Residential
  - `base_asr_rate_per_sqm`: Current Government Circle Rate in INR
  - `rural_multiplier_factor`: Multiplier based on distance from nearest urban agglomeration (1.00 to 2.00)
  - `tree_asset_valuation_schedule`: Schedule rates for timber, horticulture (Forest/Agri Dept)
* **Official Website / Source**:
  - **Portal**: [Department of Registration and Stamps (IGR Maharashtra) - e-ASR](https://igrmaharashtra.gov.in/)
  - **National Resource**: [National Land Record Circle Rate Services](https://dilrmp.gov.in/)

---

### 2.5 Devanagari OCR & Land Record Digitization Training / Ground Truth Dataset
* **Purpose**: Trains and calibrates the Human-in-the-Loop OCR engine to automatically parse scanned archaic Modi/Devanagari scripts and digital 7/12 extracts.
* **Required Attributes**:
  - `document_image`: Scanned high-resolution image file (TIFF / PNG, 300 DPI)
  - `bounding_box_coordinates`: Normalized `[ymin, xmin, ymax, xmax]` coordinates
  - `ground_truth_text`: Devanagari transcription of Gat No., Owner Name, Khatedar ID, Area (Hectare-Are)
  - `confidence_score`: Character and field-level confidence score
* **Official Website / Source**:
  - **Portal**: [BHASHINI (Digital India Bhasha AI Mission)](https://bhashini.gov.in/)
  - **Open Data & Models**: [AI4Bharat Indic OCR Repository](https://ai4bharat.iitm.ac.in/)
  - **Open Government Data**: [Data.gov.in](https://data.gov.in/)

---

### 2.6 Historical RFCTLARR Acquisition Timeline Registry (AI Delay Risk Training Data)
* **Purpose**: Calibrates the machine learning survival model (XGBoost, Random Forest, Weibull AFT) to forecast milestone delays across Sections 4, 11, 15, 19, 23, and 38.
* **Required Attributes**:
  - `case_id`: Historical Land Acquisition Notification Reference
  - `project_type`: Highway, Rail, Industrial, Water Reservoir, Urban Metro
  - `tehsil_id` & `officer_workload`: Active case volume on the Sub-Divisional Officer (SDO / SLAO)
  - `parcel_count` & `total_extent_ha`: Project magnitude
  - `objection_count_sec_15`: Number of Section 15 public objections received
  - `court_stay_flag`: Binary indicator of High Court / Supreme Court interim stay
  - `actual_days_to_award`: Real timeline elapsed from Section 11 Preliminary Notification to Section 23 Final Award
  - `lapse_event_occurred`: Right-censored flag (1 = lapsed beyond statutory 12-month window; 0 = awarded on time)
* **Official Website / Source**:
  - **Portal**: [Department of Land Resources (DoLR) - RFCTLARR MIS](https://dolr.gov.in/)
  - **State Gazettes**: [Government of India / State Official Gazette Archives](https://egazette.gov.in/)

---

### 2.7 Revenue Court Case Management & Title Dispute Feeds (Section 15 Objections)
* **Purpose**: Cross-checks land parcel claims against active litigation to flag ownership disputes before disbursing public compensation funds.
* **Required Attributes**:
  - `cnr_number`: 16-character Case Number Record
  - `court_name`: e.g., "Civil Judge Senior Division, Haveli, Pune"
  - `suit_type`: Title Declaration, Partition Suit, Succession Dispute, Land Acquisition Reference (Sec 64)
  - `survey_numbers_involved`: List of affected Gat/Khasra numbers
  - `stay_status`: Active / Vacated / Disposed
* **Official Website / Source**:
  - **Portal**: [eCourts Services India](https://ecourts.gov.in/)
  - **Revenue Courts**: [Revenue Court Case Management System (RCCMS Maharashtra)](https://mahabhumi.gov.in/)
  - **Open Judicial Data**: [National Judicial Data Grid (NJDG)](https://njdg.ecourts.gov.in/)

---

### 2.8 Public Financial Management System (PFMS) & DBT Disbursement Logs
* **Purpose**: Direct Bank Transfer (DBT) of awarded compensation to verified Khatedar accounts via PFMS / e-Kuber.
* **Required Attributes**:
  - `sanction_order_no`: Collector's statutory award disbursement sanction reference
  - `beneficiary_aadhaar_hash`: SHA-256 tokenized Aadhaar reference (DPDP-compliant)
  - `bank_ifsc_code` & `account_number_masked`: Bank disbursement endpoint
  - `award_principal_inr`, `solatium_inr`, `interest_inr`: Granular breakups
  - `pfms_utr_reference`: Unique Transaction Reference from RBI e-Kuber
  - `payment_status`: `SUCCESS`, `PENDING_CLEARING`, `FAILED_NAME_MISMATCH`
* **Official Website / Source**:
  - **Portal**: [Public Financial Management System (PFMS - CGA / MoF)](https://pfms.nic.in/)
  - **Banking Portal**: [Reserve Bank of India (RBI) e-Kuber Treasury](https://ekuber.rbi.org.in/)

---

## 3. Recommended Open Data & Developer Access Links

1. **National Open Data Portal**: [https://data.gov.in](https://data.gov.in)
2. **Mahabhumi Government Portal**: [https://mahabhumi.gov.in](https://mahabhumi.gov.in)
3. **Survey of India Geoportal**: [https://onlinemaps.surveyofindia.gov.in](https://onlinemaps.surveyofindia.gov.in)
4. **NIC BhuNaksha Portal**: [https://bhunaksha.nic.in](https://bhunaksha.nic.in)
5. **DILRMP (Digital India Land Records)**: [https://dilrmp.gov.in](https://dilrmp.gov.in)
6. **e-Courts National Portal**: [https://ecourts.gov.in](https://ecourts.gov.in)
7. **PM GatiShakti National Master Plan**: [https://www.gatispirit.in](https://www.gatispirit.in)
8. **AI4Bharat Indic Data Tools**: [https://ai4bharat.iitm.ac.in](https://ai4bharat.iitm.ac.in)
9. **PFMS Central Gateway**: [https://pfms.nic.in](https://pfms.nic.in)
10. **OpenStreetMap India Extracts**: [https://openstreetmap.in](https://openstreetmap.in)

---

## 4. Ingestion Architecture & Data Integrity Standards

```
[ BhuNaksha / Mahabhumi ]   --> OGC WFS / GeoJSON --> [ PostGIS Spatial Engine (EPSG:4326 / 32643) ]
[ Mahabhulekh (7/12 RoR) ]  --> REST API / XML     --> [ Land Parcel Registry (Share Sum = 1.0000) ]
[ PM GatiShakti / NHAI ]    --> LineString KML     --> [ ST_Buffer 60m RoW Corridor Engine ]
[ eCourts / RCCMS ]         --> Judicial Scraping  --> [ Sec 15 Dispute & Stay Flag Watchdog ]
[ PFMS / e-Kuber ]          --> ISO 20022 Direct   --> [ DBT Compensation Disbursement Engine ]
[ Historical RFCTLARR MIS ] --> Parquet / CSV      --> [ Calibrated AI Delay Risk Model (XGBoost) ]
```

* **Data Privacy Compliance**: All individual identifiers (Citizen Aadhaar, Phone Numbers, PAN) must be tokenized or salted SHA-256 hashed in compliance with the **Digital Personal Data Protection (DPDP) Act, 2023**.
* **Spatial Accuracy Mandate**: Precision polygon boundaries must adhere to Survey of India Datum specifications with area error tolerances $< 1.0\%$.
