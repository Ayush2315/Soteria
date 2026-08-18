"""
SOTERIA — Deterministic Multi-Hazard Scenario Data Seeder.
Populates PostGIS with 8 certified field volunteers and 6 realistic multi-hazard disaster incidents
(Prayagraj flood, structural collapse, electrical fire, relief camp shortages, and AI-verified resolution).

Usage:
    python backend/seed_disaster_data.py
"""
import asyncio
import logging
from datetime import datetime, timedelta
from geoalchemy2.elements import WKTElement
from sqlalchemy import select, delete

from app.core.database import AsyncSessionLocal, init_db
from app.models.incident import Incident, SourceType, TriageCategory, IncidentStatus
from app.models.volunteer import Volunteer, VolunteerStatus

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("soteria.seed")

# 8 Registered Field Volunteers situated across Prayagraj sectors
VOLUNTEERS_DATA = [
    {
        "name": "Capt. Rajesh Verma",
        "phone": "+91-9876543210",
        "skills": ["BOAT_OPERATOR", "SWIMMER", "WATER_RESCUE", "NIGHT_OPS"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4320,
        "lon": 81.8510,
        "location": "Sangam Boat Rescue Station",
    },
    {
        "name": "Dr. Ananya Sharma",
        "phone": "+91-9876543211",
        "skills": ["PARAMEDIC", "TRAUMA_SURGERY", "HYPOTHERMIA_CARE", "TRIAGE"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4480,
        "lon": 81.8340,
        "location": "Civil Lines Emergency Medical Unit",
    },
    {
        "name": "Vikram Singh (NDRF)",
        "phone": "+91-9876543212",
        "skills": ["STRUCTURAL_SHORING", "HEAVY_RESCUE", "K9_HANDLER", "ACOUSTIC_SEARCH"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4390,
        "lon": 81.8620,
        "location": "Daraganj Flood Response Camp",
    },
    {
        "name": "Sunita Patel",
        "phone": "+91-9876543213",
        "skills": ["DRONE_RECON", "THERMAL_IMAGING", "RADIO_COMMS", "GIS_MAPPING"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4210,
        "lon": 81.8410,
        "location": "Naini South Observation Post",
    },
    {
        "name": "Mohammed Tariq",
        "phone": "+91-9876543214",
        "skills": ["HIGH_VOLTAGE_ISOLATION", "FIRE_SUPPRESSION", "SCBA_BREACH", "FIRST_AID"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4410,
        "lon": 81.8290,
        "location": "Old City Fire Substation",
    },
    {
        "name": "Pooja Deshmukh",
        "phone": "+91-9876543215",
        "skills": ["LOGISTICS_DISPATCH", "SHELTER_MANAGEMENT", "CHILD_CARE", "RATION_DISTRIBUTION"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4280,
        "lon": 81.8530,
        "location": "Sharda Relief Distribution Hub",
    },
    {
        "name": "Rohan Jha",
        "phone": "+91-9876543216",
        "skills": ["BOAT_OPERATOR", "SWIMMER", "ROPE_RIGGING", "FIRST_AID"],
        "status": VolunteerStatus.DISPATCHED,
        "lat": 25.4510,
        "lon": 81.8490,
        "location": "Phaphamau Bridge Watercraft Post",
    },
    {
        "name": "Deepak Choudhary",
        "phone": "+91-9876543217",
        "skills": ["AMBULANCE_DRIVER", "FIELD_STABILIZATION", "OXYGEN_SUPPLY"],
        "status": VolunteerStatus.AVAILABLE,
        "lat": 25.4190,
        "lon": 81.7750,
        "location": "Jhalwa Emergency Transit Post",
    },
]

# 6 Multi-Hazard Incidents across Prayagraj
INCIDENTS_DATA = [
    {
        "source_type": SourceType.VOICE,
        "raw_payload": "बाढ़ का पानी छत तक पहुँच गया है! 4 लोग फंसे हैं, एक नवजात शिशु और बुजुर्ग महिला हैं, नाव भेजो!",
        "location_name": "North Ghat, Sector 3, Sangam, Prayagraj",
        "lat": 25.4358,
        "lon": 81.8463,
        "triage_score": 94.0,
        "triage_category": TriageCategory.CRITICAL_P1,
        "status": IncidentStatus.TRIAGED,
        "is_offline_cached": False,
        "extracted_entities": {
            "trapped_count": 4,
            "is_trapped": True,
            "medical_needs": ["HYPOTHERMIA_RISK", "PEDIATRIC_MONITORING"],
            "hazard_types": ["FLOOD"],
            "hazard_severity": 10,
            "people_affected": 4,
            "vulnerable_people": {"elderly": 1, "children": 1, "pregnant": 0, "disabled": 0},
            "detected_language": "Hindi / Bhojpuri",
            "translation_en": "Flood water has reached the roof! 4 people are trapped, including a newborn infant and an elderly woman, send a boat!",
            "confidence_score": 0.98,
        },
        "safety_sop": {
            "urgency_summary": "Surging flood current with casualties marooned on collapsing rooftop. Immediate watercraft extraction required.",
            "hazards_detected": ["SURGING_WATER", "SUBMERGED_DEBRIS", "ROOF_INSTABILITY"],
            "recommended_gear": ["Inflatable Motorized Boat", "Adult & Pediatric PFDs", "Thermal Foil Blankets", "Throw Bags"],
            "protocol_steps": [
                "1. Approach rooftop from upstream with anchor line to avoid vortex current near ghat steps.",
                "2. Evacuate newborn and elderly first into rigid center vessel; secure with pediatric life vests.",
                "3. Administer immediate thermal blankets for hypothermia and transport to Sangam Primary Medical Post.",
            ],
        },
    },
    {
        "source_type": SourceType.IMAGE,
        "raw_payload": "Two-story masonry wall collapsed over residential alleyway. 2 people trapped under debris near sparking transformer.",
        "location_name": "Old City Main Bazaar, Lane 4, Prayagraj",
        "lat": 25.4412,
        "lon": 81.8329,
        "triage_score": 88.5,
        "triage_category": TriageCategory.CRITICAL_P1,
        "status": IncidentStatus.DISPATCHED,
        "is_offline_cached": True,
        "extracted_entities": {
            "trapped_count": 2,
            "is_trapped": True,
            "medical_needs": ["CRUSH_SYNDROME_IV", "HEAD_TRAUMA_STABILIZATION"],
            "hazard_types": ["STRUCTURAL_COLLAPSE", "ELECTRICAL"],
            "hazard_severity": 9,
            "people_affected": 3,
            "vulnerable_people": {"elderly": 1, "children": 0, "pregnant": 0, "disabled": 0},
            "detected_language": "English",
            "translation_en": "Two-story masonry wall collapsed over residential alleyway. 2 people trapped under debris near sparking transformer.",
            "confidence_score": 0.94,
        },
        "safety_sop": {
            "urgency_summary": "Active crush hazard and live electrical arcing. Power isolation required before hydraulic debris breach.",
            "hazards_detected": ["LIVE_ARCS", "UNSTABLE_MASONRY", "TOXIC_DUST"],
            "recommended_gear": ["Dielectric Safety Gloves (10kV)", "Pneumatic Lifting Bags", "Rigid Cervical Collars", "N95 Dust Masks"],
            "protocol_steps": [
                "1. Establish 25-meter safety perimeter and request emergency power grid isolation from UPPC.",
                "2. Erect pneumatic shoring supports to stabilize adjacent standing wall prior to debris lifting.",
                "3. Secure victims with rigid cervical collars and initiate crush syndrome fluid resuscitation.",
            ],
        },
    },
    {
        "source_type": SourceType.TEXT,
        "raw_payload": "Floodwater rapidly entering ground floor homes in Daraganj. Wheelchair-bound elderly resident unable to climb stairs.",
        "location_name": "Daraganj Ganga Nagar, Ward 12, Prayagraj",
        "lat": 25.4375,
        "lon": 81.8640,
        "triage_score": 76.0,
        "triage_category": TriageCategory.URGENT_P2,
        "status": IncidentStatus.REPORTED,
        "is_offline_cached": False,
        "extracted_entities": {
            "trapped_count": 1,
            "is_trapped": True,
            "medical_needs": ["MOBILITY_EXTRICATION", "CHRONIC_MEDICATION_RELIEF"],
            "hazard_types": ["FLOOD"],
            "hazard_severity": 7,
            "people_affected": 2,
            "vulnerable_people": {"elderly": 1, "children": 0, "pregnant": 0, "disabled": 1},
            "detected_language": "English",
            "translation_en": "Floodwater rapidly entering ground floor homes in Daraganj. Wheelchair-bound elderly resident unable to climb stairs.",
            "confidence_score": 0.95,
        },
        "safety_sop": {
            "urgency_summary": "Disabled elder stranded in rising water (3ft). Ground-level water evacuation required.",
            "hazards_detected": ["RISING_WATER", "ELECTRICAL_GROUND_CURRENT"],
            "recommended_gear": ["Floating Stretcher", "Chest Waders", "Insulated Cutters", "Dry Bags"],
            "protocol_steps": [
                "1. Disconnect household main fuse breaker before entering standing water.",
                "2. Transfer wheelchair patient into floating basket stretcher with spinal alignment.",
                "3. Transport along elevated levee road to High Ground Sector 2.",
            ],
        },
    },
    {
        "source_type": SourceType.VOICE,
        "raw_payload": "सिविल लाइंस मार्केट में ट्रांसफार्मर में जोरदार धमाका हुआ है, गहरा काला धुआं और आग की लपटें दुकानों की तरफ बढ़ रही हैं!",
        "location_name": "Civil Lines Commercial Plaza, Sector 4, Prayagraj",
        "lat": 25.4520,
        "lon": 81.8310,
        "triage_score": 68.0,
        "triage_category": TriageCategory.URGENT_P2,
        "status": IncidentStatus.REPORTED,
        "is_offline_cached": False,
        "extracted_entities": {
            "trapped_count": 0,
            "is_trapped": False,
            "medical_needs": ["SMOKE_INHALATION_O2", "MINOR_BURN_CARE"],
            "hazard_types": ["FIRE", "ELECTRICAL"],
            "hazard_severity": 7,
            "people_affected": 15,
            "vulnerable_people": {"elderly": 2, "children": 1, "pregnant": 0, "disabled": 0},
            "detected_language": "Hindi",
            "translation_en": "Loud transformer explosion at Civil Lines Market, dense black smoke and flames spreading toward storefronts!",
            "confidence_score": 0.96,
        },
        "safety_sop": {
            "urgency_summary": "Oil transformer fire with toxic hydrocarbon smoke plume. Upwind evacuation corridor active.",
            "hazards_detected": ["OIL_FIRE", "TOXIC_SMOKE_PLUME", "EXPLOSION_RISK"],
            "recommended_gear": ["Class ABC Dry Chemical Extinguishers", "SCBA Breathing Packs", "Emergency Megaphone"],
            "protocol_steps": [
                "1. Direct pedestrian crowd upwind toward MG Road; maintain 50m standoff from burning oil.",
                "2. Apply Class ABC dry chemical suppression; DO NOT use direct stream water on oil fire.",
                "3. Triage smoke inhalation casualties and administer high-flow oxygen.",
            ],
        },
    },
    {
        "source_type": SourceType.TEXT,
        "raw_payload": "Drinking water supply contaminated and running out at Sharda High School relief shelter. 50 evacuees present.",
        "location_name": "Sharda Relief Camp, Zone 2, Prayagraj",
        "lat": 25.4289,
        "lon": 81.8541,
        "triage_score": 48.0,
        "triage_category": TriageCategory.MODERATE_P3,
        "status": IncidentStatus.IN_PROGRESS,
        "is_offline_cached": False,
        "extracted_entities": {
            "trapped_count": 0,
            "is_trapped": False,
            "medical_needs": ["POTABLE_WATER", "ELECTROLYTE_SOLUTIONS", "INFANT_RATIONS"],
            "hazard_types": ["RESOURCE_SHORTAGE"],
            "hazard_severity": 4,
            "people_affected": 50,
            "vulnerable_people": {"elderly": 10, "children": 15, "pregnant": 2, "disabled": 2},
            "detected_language": "English",
            "translation_en": "Drinking water supply contaminated and running out at Sharda High School relief shelter. 50 evacuees present.",
            "confidence_score": 0.99,
        },
        "safety_sop": {
            "urgency_summary": "Sustenance and potable water replenishment. Zero acute life peril.",
            "hazards_detected": ["WATERBORNE_PATHOGENS", "DEHYDRATION"],
            "recommended_gear": ["Water Purification Tablets", "200L Sealed Water Dispensers", "ORS Sachets"],
            "protocol_steps": [
                "1. Distribute 300L bottled potable water and ORS rehydration packs to mothers and infants.",
                "2. Inspect sanitation facilities and chlorinate local holding tanks.",
                "3. Record camp roster for next scheduled ration convoy.",
            ],
        },
    },
    {
        "source_type": SourceType.IMAGE,
        "raw_payload": "Submerged vehicle extrication at Naini Industrial Causeway. Driver and passenger assisted to dry bank.",
        "location_name": "Naini Industrial Causeway, Prayagraj",
        "lat": 25.4150,
        "lon": 81.8610,
        "triage_score": 72.0,
        "triage_category": TriageCategory.URGENT_P2,
        "status": IncidentStatus.RESOLVED,
        "is_offline_cached": True,
        "extracted_entities": {
            "trapped_count": 0,
            "is_trapped": False,
            "medical_needs": ["FIRST_AID_EVALUATION"],
            "hazard_types": ["FLOOD", "VEHICLE_SUBMERSION"],
            "hazard_severity": 6,
            "people_affected": 2,
            "vulnerable_people": {"elderly": 0, "children": 0, "pregnant": 0, "disabled": 0},
            "detected_language": "English",
            "translation_en": "Submerged vehicle extrication at Naini Industrial Causeway. Driver and passenger assisted to dry bank.",
            "confidence_score": 0.97,
        },
        "safety_sop": {
            "urgency_summary": "Vehicle submersion rescue completed. Tow winch recovery and bank stabilization verified.",
            "hazards_detected": ["VEHICLE_SUBMERSION"],
            "recommended_gear": ["Winch Cable", "Life Jackets", "Tow Straps"],
            "protocol_steps": [
                "1. Secure vehicle chassis to safety line.",
                "2. Escort occupants to dry levee.",
                "3. Mark submerged obstruction with high-visibility buoy.",
            ],
        },
        "verification_data": {
            "is_verified": True,
            "confidence_score": 0.98,
            "visual_observations": "Photo audit confirms vehicle secured and occupants safe on dry ground. Water depth marked with warning cone.",
            "hazard_clearance_status": "HAZARD_RESOLVED",
            "closure_summary": "AI Closed-Loop Audit Verified: Vehicle successfully extricated. Both victims examined with zero critical trauma. Area declared clear.",
            "proof_photo_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80",
            "closure_notes": "Extrication complete. Vehicle winched to levee and both passengers transported to shelter.",
            "closed_by_volunteer_id": 1,
            "resolved_at": (datetime.utcnow() - timedelta(minutes=12)).isoformat(),
        },
    },
]


async def seed():
    """Executes database schema initialization and deterministic data seeding."""
    logger.info("Initializing PostGIS tables if needed...")
    await init_db()

    async with AsyncSessionLocal() as session:
        logger.info("Purging previous seed test records...")
        await session.execute(delete(Incident))
        await session.execute(delete(Volunteer))
        await session.commit()

        logger.info(f"Seeding {len(VOLUNTEERS_DATA)} certified Prayagraj field volunteers...")
        created_volunteers = []
        for v in VOLUNTEERS_DATA:
            geom = WKTElement(f"POINT({v['lon']} {v['lat']})", srid=4326)
            vol = Volunteer(
                name=v["name"],
                phone=v["phone"],
                skills=v["skills"],
                status=v["status"],
                current_latitude=v["lat"],
                current_longitude=v["lon"],
                current_geom=geom,
                is_active=True,
                last_ping=datetime.utcnow() - timedelta(minutes=5),
            )
            session.add(vol)
            created_volunteers.append(vol)

        await session.commit()
        for v in created_volunteers:
            await session.refresh(v)

        logger.info(f"Successfully seeded {len(created_volunteers)} volunteers.")

        logger.info(f"Seeding {len(INCIDENTS_DATA)} multi-hazard disaster incidents...")
        for idx, inc_data in enumerate(INCIDENTS_DATA):
            geom = WKTElement(f"POINT({inc_data['lon']} {inc_data['lat']})", srid=4326)
            assigned_id = created_volunteers[idx % len(created_volunteers)].id if inc_data["status"] == IncidentStatus.DISPATCHED else None

            inc = Incident(
                source_type=inc_data["source_type"],
                raw_payload=inc_data["raw_payload"],
                location_name=inc_data["location_name"],
                latitude=inc_data["lat"],
                longitude=inc_data["lon"],
                location_geom=geom,
                triage_score=inc_data["triage_score"],
                triage_category=inc_data["triage_category"],
                status=inc_data["status"],
                extracted_entities=inc_data["extracted_entities"],
                safety_sop=inc_data["safety_sop"],
                assigned_volunteer_id=assigned_id,
                verification_data=inc_data.get("verification_data", {}),
                is_offline_cached=inc_data["is_offline_cached"],
                client_timestamp=datetime.utcnow() - timedelta(minutes=idx * 10),
                created_at=datetime.utcnow() - timedelta(minutes=idx * 10),
                updated_at=datetime.utcnow() - timedelta(minutes=idx * 2),
            )
            session.add(inc)

        await session.commit()
        logger.info(f"Successfully seeded {len(INCIDENTS_DATA)} disaster incidents into PostGIS.")

        logger.info("Deterministic demo seeding COMPLETE. SOTERIA is ready for evaluation!")


if __name__ == "__main__":
    asyncio.run(seed())
