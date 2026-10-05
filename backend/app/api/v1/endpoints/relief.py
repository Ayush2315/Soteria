"""
SOTERIA — Relief Operations, Safe Havens, Hyperlocal Spot Nominations, Quota Balancing & Supply Dispatch API.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter()


class SafeHavenStatus(str, Enum):
    OPEN_CAPACITY = "OPEN_CAPACITY"
    NEAR_CAPACITY = "NEAR_CAPACITY"
    FULL_REDIRECT = "FULL_REDIRECT"


class SafeHaven(BaseModel):
    id: str
    name: str
    type: str  # e.g., "ELEVATED_STADIUM", "HIGH_SCHOOL_CAMP", "MEDICAL_POST"
    status: SafeHavenStatus
    capacity_total: int
    capacity_used: int
    latitude: float
    longitude: float
    elevation_meters: Optional[float] = 95.0
    supplies: List[str]
    medical_team_on_site: bool
    safe_zone_radius_meters: int
    distance_to_flood_meters: int
    safe_corridor_route: Optional[str] = None


class HazardDangerZone(BaseModel):
    id: str
    name: str
    hazard_type: str
    severity: str  # "EXTREME_P1", "CRITICAL_P1", "HIGH_P2"
    inundation_depth_meters: float
    active_advisory: str
    evacuation_status: str


class SafeHavensResponse(BaseModel):
    safe_havens: List[SafeHaven]
    hazard_danger_zones: List[HazardDangerZone]
    last_updated: str


class NominateSpotPayload(BaseModel):
    spot_name: str = Field(..., min_length=2)
    latitude: float
    longitude: float
    terrain_type: str = "ELEVATED_GROUND"  # "FLAT_ROOFTOP", "ELEVATED_LEVEE", "DRY_CLEARING", "HELIPAD_READY"
    accessibility_notes: Optional[str] = None
    nominated_by_name: Optional[str] = "Anonymous Citizen"
    phone: Optional[str] = None


class NominatedSpot(BaseModel):
    id: str
    spot_name: str
    latitude: float
    longitude: float
    terrain_type: str
    status: str  # "PENDING_RECON", "APPROVED_ACTIVE", "REJECTED", "SUPPLY_DISPATCHED"
    nominated_by: str
    nominated_at: str
    accessibility_notes: Optional[str] = None
    cleared_by_volunteer: Optional[str] = None
    verified_at: Optional[str] = None
    last_supply_dispatch: Optional[Dict[str, Any]] = None


class VolunteerTask(BaseModel):
    task_id: str
    title: str
    category: str
    risk_level: int  # 1 to 4
    risk_label: str  # "Level 1: Low", "Level 2: Moderate", "Level 3: High", "Level 4: Extreme"
    required_ppe: List[str]
    sector: str
    required_volunteers: int
    current_volunteers: int
    status: str  # "OPEN", "QUOTA_FULL", "IN_PROGRESS", "APPROVED_SAFE"
    description: str
    is_spot_recon: bool = False
    target_spot_id: Optional[str] = None
    volunteer_names: List[str] = Field(default_factory=list)


class TaskVolunteerAction(BaseModel):
    volunteer_id: int
    volunteer_name: Optional[str] = "Capt. Aarav Sharma"
    action: str = Field("join", description="'join' or 'leave'")


class VerifySpotPayload(BaseModel):
    spot_id: str
    volunteer_id: int
    volunteer_name: Optional[str] = "Capt. Aarav Sharma"
    is_approved: bool
    hazard_clearance_notes: str
    suitable_for_helicopter: bool = True
    suitable_for_boat: bool = True


class SupplyDispatchPayload(BaseModel):
    spot_id: str
    supplies: List[str] = Field(default_factory=lambda: ["RATIONS_48H", "POTABLE_WATER", "TRAUMA_KITS"])
    transport_type: str = "HELICOPTER_AIRDROP"  # "HELICOPTER_AIRDROP", "RESCUE_BOAT_CONVOY", "4X4_AMPHIBIOUS_TRUCK"
    notes: Optional[str] = None


# In-Memory Dynamic Storage for Live Demo & Real-Time Sync
SAFE_HAVENS_DATA: List[SafeHaven] = [
    SafeHaven(
        id="SH-01",
        name="Prayagraj Sports Complex Elevated Levee",
        type="ELEVATED_STADIUM",
        status=SafeHavenStatus.OPEN_CAPACITY,
        capacity_total=500,
        capacity_used=180,
        latitude=25.4425,
        longitude=81.8490,
        elevation_meters=104.5,
        supplies=["DRINKING_WATER", "RATIONS_48H", "BLANKETS", "POWER_GENERATOR"],
        medical_team_on_site=True,
        safe_zone_radius_meters=450,
        distance_to_flood_meters=850,
        safe_corridor_route="Approach via MG Marg North bypass. Avoid riverfront embankment.",
    ),
    SafeHaven(
        id="SH-02",
        name="Sharda Inter College Disaster Relief Camp",
        type="HIGH_SCHOOL_CAMP",
        status=SafeHavenStatus.NEAR_CAPACITY,
        capacity_total=250,
        capacity_used=235,
        latitude=25.4289,
        longitude=81.8541,
        elevation_meters=98.2,
        supplies=["DRINKING_WATER", "INFANT_NUTRITION", "PEDIATRIC_CARE"],
        medical_team_on_site=True,
        safe_zone_radius_meters=300,
        distance_to_flood_meters=400,
        safe_corridor_route="Enter via Southern elevated overpass. Eastern lane is cordoned.",
    ),
    SafeHaven(
        id="SH-03",
        name="Civil Lines Primary Medical & Evacuation Post",
        type="MEDICAL_POST",
        status=SafeHavenStatus.OPEN_CAPACITY,
        capacity_total=150,
        capacity_used=42,
        latitude=25.4510,
        longitude=81.8320,
        elevation_meters=112.0,
        supplies=["SURGICAL_TRAUMA_KITS", "OXYGEN_CYLINDERS", "IV_FLUIDS"],
        medical_team_on_site=True,
        safe_zone_radius_meters=600,
        distance_to_flood_meters=1400,
        safe_corridor_route="Direct dry corridor along Sardar Patel Marg. Fully clear of water.",
    ),
    SafeHaven(
        id="SH-04",
        name="Daraganj Ghat Community Relief Centre",
        type="RIVER_SHELTER",
        status=SafeHavenStatus.FULL_REDIRECT,
        capacity_total=80,
        capacity_used=80,
        latitude=25.4370,
        longitude=81.8635,
        elevation_meters=91.0,
        supplies=["RATIONS_24H", "EMERGENCY_FLASHLIGHTS"],
        medical_team_on_site=False,
        safe_zone_radius_meters=150,
        distance_to_flood_meters=80,
        safe_corridor_route="FULL: Evacuees are redirected 900m Northwest to SH-01 Sports Complex.",
    ),
]

HAZARD_ZONES_DATA: List[HazardDangerZone] = [
    HazardDangerZone(
        id="HZ-01",
        name="North Ghat Riverfront Submersion Sector",
        hazard_type="FLOOD_CURRENT",
        severity="EXTREME_P1",
        inundation_depth_meters=3.8,
        active_advisory="Rooftop-level flooding with high-velocity current. DO NOT ATTEMPT WADING.",
        evacuation_status="IMMEDIATE_AIR_BOAT_EVACUATION",
    ),
    HazardDangerZone(
        id="HZ-02",
        name="Old City Market Masonry Collapse & Electrical Arcing",
        hazard_type="STRUCTURAL_ELECTRICAL",
        severity="CRITICAL_P1",
        inundation_depth_meters=0.6,
        active_advisory="Collapsed masonry wall with live transformer sparking. 50m blast perimeter.",
        evacuation_status="CORDON_ACTIVE_NO_ENTRY",
    ),
    HazardDangerZone(
        id="HZ-03",
        name="Naini Causeway Submerged Underpass",
        hazard_type="FLASH_FLOOD",
        severity="HIGH_P2",
        inundation_depth_meters=2.1,
        active_advisory="Vehicle entrapment zone. Submerged road barriers present.",
        evacuation_status="ROAD_BLOCKED_DIVERT_NORTH",
    ),
]

NOMINATED_SPOTS_DATA: List[NominatedSpot] = [
    NominatedSpot(
        id="SPOT-101",
        spot_name="St. Peter Church Concrete Terrace",
        latitude=25.4382,
        longitude=81.8485,
        terrain_type="FLAT_ROOFTOP",
        status="PENDING_RECON",
        nominated_by="Ramesh Gupta (Local Resident)",
        nominated_at="10 mins ago",
        accessibility_notes="Reinforced 30x20m flat rooftop above water level, dry approach from South lane.",
    ),
    NominatedSpot(
        id="SPOT-102",
        spot_name="Daraganj Overbridge High Levee",
        latitude=25.4350,
        longitude=81.8590,
        terrain_type="ELEVATED_LEVEE",
        status="APPROVED_ACTIVE",
        nominated_by="Capt. Rajesh Verma",
        nominated_at="25 mins ago",
        accessibility_notes="Broad concrete embankment 4.5m above flood water. Boat tie-offs accessible.",
        cleared_by_volunteer="Capt. Aarav Sharma",
        verified_at="15 mins ago",
    ),
]

VOLUNTEER_TASKS_DATA: List[VolunteerTask] = [
    VolunteerTask(
        task_id="TASK-801",
        title="North Ghat Flood Rescue & Pediatric Life Vest Evacuation",
        category="WATER_RESCUE",
        risk_level=4,
        risk_label="Level 4: Extreme (Severe Flood Current)",
        required_ppe=["TYPE_V_PFD", "HELMET_WATER", "DRYSUIT", "THROW_LINE"],
        sector="North Ghat Sector 3",
        required_volunteers=4,
        current_volunteers=2,
        status="OPEN",
        description="Assisting 4 marooned casualties (infant + elderly) on submerged rooftop at North Ghat.",
        volunteer_names=["Vikram Singh", "Priya Nair"],
    ),
    VolunteerTask(
        task_id="TASK-802",
        title="Old City Masonry Wall Shoring & Power Cordon",
        category="STRUCTURAL_RESCUE",
        risk_level=3,
        risk_label="Level 3: High (Falling Debris + Live Arcing)",
        required_ppe=["HARD_HAT", "STEEL_TOE_BOOTS", "INSULATED_GLOVES", "HIGH_VIS_VEST"],
        sector="Old City Market Lane 4",
        required_volunteers=3,
        current_volunteers=3,
        status="QUOTA_FULL",
        description="Shoring unstable two-story masonry wall near sparking electrical transformer.",
        volunteer_names=["Rohit Mehra", "Anjali Verma", "Deepak Joshi"],
    ),
    VolunteerTask(
        task_id="TASK-803",
        title="Ground Recon: Inspect St. Peter Church Supply Drop Spot",
        category="SUPPLY_AIRDROP_RECON",
        risk_level=2,
        risk_label="Level 2: Moderate (Foot Reconnaissance)",
        required_ppe=["SAFETY_BOOTS", "HIGH_VIS_VEST", "WATERPROOF_RADIO"],
        sector="Sangam Grid Sector 2",
        required_volunteers=2,
        current_volunteers=0,
        status="OPEN",
        description="Inspect nominated spot #SPOT-101 for clear helicopter/boat airdrop clearance.",
        is_spot_recon=True,
        target_spot_id="SPOT-101",
        volunteer_names=[],
    ),
    VolunteerTask(
        task_id="TASK-804",
        title="Civil Lines Smoke Inhalation First Aid & Oxygen Standby",
        category="MEDICAL_STABILIZATION",
        risk_level=2,
        risk_label="Level 2: Moderate (Toxic Smoke Residue)",
        required_ppe=["N95_RESPIRATOR", "NITRILE_GLOVES", "FIRST_AID_KIT"],
        sector="Civil Lines Market",
        required_volunteers=2,
        current_volunteers=1,
        status="OPEN",
        description="Administering high-flow oxygen and burn triage for smoke inhalation victims.",
        volunteer_names=["Dr. Sunita Rao"],
    ),
]


@router.get("/safe-havens", response_model=SafeHavensResponse, summary="Get Safe Havens & Danger Zones")
async def get_safe_havens() -> SafeHavensResponse:
    """
    Returns active safe haven shelters, GPS coordinates, elevation, capacity levels, supplies, and flood danger zones.
    """
    return SafeHavensResponse(
        safe_havens=SAFE_HAVENS_DATA,
        hazard_danger_zones=HAZARD_ZONES_DATA,
        last_updated=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/nominate", status_code=status.HTTP_201_CREATED, summary="Nominate a Supply Drop Spot")
async def nominate_supply_drop_spot(payload: NominateSpotPayload):
    """
    Allows citizens or local responders with ground terrain knowledge to nominate an elevated supply drop spot.
    Automatically generates a volunteer ground reconnaissance task in the Volunteer Hub.
    """
    new_spot = NominatedSpot(
        id=f"SPOT-{len(NOMINATED_SPOTS_DATA) + 101}",
        spot_name=payload.spot_name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        terrain_type=payload.terrain_type,
        status="PENDING_RECON",
        nominated_by=payload.nominated_by_name or "Local Citizen",
        nominated_at="Just now",
        accessibility_notes=payload.accessibility_notes,
    )
    NOMINATED_SPOTS_DATA.insert(0, new_spot)

    # Automatically create a volunteer recon task
    recon_task = VolunteerTask(
        task_id=f"TASK-{len(VOLUNTEER_TASKS_DATA) + 801}",
        title=f"Ground Recon: Inspect {payload.spot_name}",
        category="SUPPLY_AIRDROP_RECON",
        risk_level=2,
        risk_label="Level 2: Moderate (Foot Reconnaissance)",
        required_ppe=["SAFETY_BOOTS", "HIGH_VIS_VEST", "WATERPROOF_RADIO"],
        sector="Hyperlocal Sector",
        required_volunteers=2,
        current_volunteers=0,
        status="OPEN",
        description=f"Inspect nominated drop spot #{new_spot.id} for clear approach and obstacles. Notes: {payload.accessibility_notes or 'Terrain clear'}",
        is_spot_recon=True,
        target_spot_id=new_spot.id,
        volunteer_names=[],
    )
    VOLUNTEER_TASKS_DATA.insert(0, recon_task)

    return {
        "success": True,
        "spot": new_spot,
        "task_id": recon_task.task_id,
        "message": f"Spot '{payload.spot_name}' successfully nominated with ID #{new_spot.id}. Routed to Volunteer Hub for field recon!",
    }


@router.get("/nominated-spots", response_model=List[NominatedSpot], summary="List Nominated Supply Drop Spots")
async def get_nominated_spots(status_filter: Optional[str] = Query("ALL", alias="status")) -> List[NominatedSpot]:
    """
    Returns citizen-nominated supply drop spots, optionally filtered by status ('ALL', 'PENDING_RECON', 'APPROVED_ACTIVE', 'SUPPLY_DISPATCHED').
    """
    if not status_filter or status_filter == "ALL":
        return NOMINATED_SPOTS_DATA
    return [s for s in NOMINATED_SPOTS_DATA if s.status == status_filter]


@router.get("/volunteer-tasks", response_model=List[VolunteerTask], summary="List Volunteer Tasks & Quotas")
async def get_volunteer_tasks() -> List[VolunteerTask]:
    """
    Returns active volunteer field response tasks with capacity quotas and transparent Level 1-4 risk ratings.
    """
    return VOLUNTEER_TASKS_DATA


@router.post("/tasks/{task_id}/volunteer", summary="Volunteer Join or Leave Mission Quota")
async def volunteer_for_task(task_id: str, payload: TaskVolunteerAction):
    """
    Allows a volunteer to claim a spot or withdraw from a task quota.
    Updates current_volunteers count and toggles status between OPEN and QUOTA_FULL.
    """
    target_task: Optional[VolunteerTask] = None
    for task in VOLUNTEER_TASKS_DATA:
        if task.task_id == task_id:
            target_task = task
            break

    if not target_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Volunteer task #{task_id} not found.",
        )

    vol_name = payload.volunteer_name or f"Volunteer #{payload.volunteer_id}"

    if payload.action == "join":
        if target_task.current_volunteers >= target_task.required_volunteers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task #{task_id} quota is full ({target_task.required_volunteers}/{target_task.required_volunteers}). Please select another mission.",
            )
        if vol_name not in target_task.volunteer_names:
            target_task.volunteer_names.append(vol_name)
        target_task.current_volunteers = len(target_task.volunteer_names)
        if target_task.current_volunteers >= target_task.required_volunteers:
            target_task.status = "QUOTA_FULL"
        msg = f"Successfully volunteered for '{target_task.title}'. Current quota: {target_task.current_volunteers}/{target_task.required_volunteers}."
    else:  # leave
        if vol_name in target_task.volunteer_names:
            target_task.volunteer_names.remove(vol_name)
        target_task.current_volunteers = max(0, len(target_task.volunteer_names))
        if target_task.current_volunteers < target_task.required_volunteers and target_task.status != "APPROVED_SAFE":
            target_task.status = "OPEN"
        msg = f"Withdrew from '{target_task.title}'. Current quota: {target_task.current_volunteers}/{target_task.required_volunteers}."

    return {
        "success": True,
        "task": target_task,
        "message": msg,
    }


@router.post("/verify-spot", summary="Volunteer Verify/Approve Nominated Drop Spot")
async def verify_drop_spot(payload: VerifySpotPayload):
    """
    Field volunteer verifies ground conditions for a nominated supply drop spot.
    Persists approval, marks spot as APPROVED_ACTIVE or REJECTED, and updates recon task status.
    """
    target_spot: Optional[NominatedSpot] = None
    for spot in NOMINATED_SPOTS_DATA:
        if spot.id == payload.spot_id:
            spot.status = "APPROVED_ACTIVE" if payload.is_approved else "REJECTED"
            spot.cleared_by_volunteer = payload.volunteer_name or f"Volunteer #{payload.volunteer_id}"
            spot.verified_at = datetime.now(timezone.utc).strftime("%H:%M UTC (Just now)")
            if payload.hazard_clearance_notes:
                spot.accessibility_notes = f"{spot.accessibility_notes or ''} [Recon audit: {payload.hazard_clearance_notes}]".strip()
            target_spot = spot
            break

    for task in VOLUNTEER_TASKS_DATA:
        if task.target_spot_id == payload.spot_id:
            task.status = "APPROVED_SAFE" if payload.is_approved else "QUOTA_FULL"
            break

    if not target_spot:
        # Create or update spot in memory if missing
        target_spot = NominatedSpot(
            id=payload.spot_id,
            spot_name=f"Recon Spot #{payload.spot_id}",
            latitude=25.4382,
            longitude=81.8485,
            terrain_type="FLAT_ROOFTOP",
            status="APPROVED_ACTIVE" if payload.is_approved else "REJECTED",
            nominated_by="Ground Recon Team",
            nominated_at="Today",
            cleared_by_volunteer=payload.volunteer_name or f"Volunteer #{payload.volunteer_id}",
            verified_at="Just now",
            accessibility_notes=payload.hazard_clearance_notes,
        )
        NOMINATED_SPOTS_DATA.insert(0, target_spot)

    return {
        "success": True,
        "spot": target_spot,
        "spot_id": payload.spot_id,
        "status": "APPROVED_ACTIVE" if payload.is_approved else "REJECTED",
        "message": f"Spot #{payload.spot_id} successfully {('APPROVED as Safe Airdrop Zone' if payload.is_approved else 'REJECTED')} and transmitted to Logistics Command.",
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/dispatch-supply", summary="HQ Commander Dispatch Supply Convoy to Approved Spot")
async def dispatch_supply_to_spot(payload: SupplyDispatchPayload):
    """
    Logistics & Command HQ dispatches helicopter airdrops, boat convoys, or 4x4 amphibious trucks to verified spots.
    """
    target_spot: Optional[NominatedSpot] = None
    for spot in NOMINATED_SPOTS_DATA:
        if spot.id == payload.spot_id:
            spot.status = "SUPPLY_DISPATCHED"
            spot.last_supply_dispatch = {
                "transport_type": payload.transport_type,
                "supplies": payload.supplies,
                "dispatched_at": datetime.now(timezone.utc).strftime("%H:%M UTC (Just now)"),
                "convoy_code": f"AIRDROP-{spot.id}-{datetime.now(timezone.utc).strftime('%M%S')}",
                "notes": payload.notes or "Immediate high-priority relief rations deployed.",
            }
            target_spot = spot
            break

    if not target_spot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approved drop spot #{payload.spot_id} not found.",
        )

    return {
        "success": True,
        "spot": target_spot,
        "convoy_code": target_spot.last_supply_dispatch["convoy_code"],
        "message": f"Relief shipment ({payload.transport_type}) successfully dispatched to {target_spot.spot_name}.",
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
    }
