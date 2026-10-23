"""
Distance, Relative Motion, Trajectory Convergence, and Time-To-Collision (TTC) Engine.
"""
import math
from typing import Optional, Dict, Any, Tuple
from hackeye.edge.tracker import TrackedObject

class ProximityAnalysis:
    def __init__(
        self,
        worker_id: str,
        machine_id: str,
        machine_type: str,
        estimated_distance_m: float,
        closing_velocity_m_s: float,
        is_converging: bool,
        ttc_seconds: Optional[float],
        worker_pos: Tuple[float, float],
        machine_pos: Tuple[float, float]
    ):
        self.worker_id = worker_id
        self.machine_id = machine_id
        self.machine_type = machine_type
        self.estimated_distance_m = round(estimated_distance_m, 2)
        self.closing_velocity_m_s = round(closing_velocity_m_s, 2)
        self.is_converging = is_converging
        self.ttc_seconds = round(ttc_seconds, 2) if ttc_seconds is not None else None
        self.worker_pos = worker_pos
        self.machine_pos = machine_pos

    def to_dict(self) -> Dict[str, Any]:
        return {
            "worker_id": self.worker_id,
            "machine_id": self.machine_id,
            "machine_type": self.machine_type,
            "estimated_distance_m": self.estimated_distance_m,
            "closing_velocity_m_s": self.closing_velocity_m_s,
            "is_converging": self.is_converging,
            "ttc_seconds": self.ttc_seconds,
            "worker_pos": [round(x, 1) for x in self.worker_pos],
            "machine_pos": [round(x, 1) for x in self.machine_pos]
        }

class TTCEngine:
    def __init__(self, pixels_per_meter: float = 35.0):
        self.pixels_per_meter = pixels_per_meter

    def compute_proximity(self, worker: TrackedObject, machine: TrackedObject) -> ProximityAnalysis:
        # 1. Compute Euclidean distance between contact footpoints on ground plane
        dx_px = worker.footpoint[0] - machine.footpoint[0]
        dy_px = worker.footpoint[1] - machine.footpoint[1]
        dist_px = math.sqrt(dx_px**2 + dy_px**2)
        
        # Explicitly labeled Estimated Distance (m)
        dist_m = max(dist_px / self.pixels_per_meter, 0.1)

        # 2. Relative velocity vector (Worker relative to Machine)
        rel_vx = worker.vx_m_s - machine.vx_m_s
        rel_vy = worker.vy_m_s - machine.vy_m_s

        # Normal unit vector pointing from Machine to Worker
        if dist_px > 0.001:
            nx = dx_px / dist_px
            ny = dy_px / dist_px
        else:
            nx, ny = 1.0, 0.0

        # Closing velocity is the component of relative velocity directed towards each other
        # v_closing = -(rel_v . n)
        closing_velocity = -(rel_vx * nx + rel_vy * ny)

        # 3. Trajectory convergence check
        is_converging = closing_velocity > 0.15 # threshold 0.15 m/s closing speed

        # 4. Time-to-Collision (TTC) Calculation
        ttc = None
        if is_converging and closing_velocity > 0.05:
            calculated_ttc = dist_m / closing_velocity
            # Cap TTC to a realistic maximum of 30.0s for safety monitoring
            if calculated_ttc < 30.0:
                ttc = calculated_ttc

        return ProximityAnalysis(
            worker_id=worker.track_id,
            machine_id=machine.track_id,
            machine_type=machine.industrial_type,
            estimated_distance_m=dist_m,
            closing_velocity_m_s=closing_velocity,
            is_converging=is_converging,
            ttc_seconds=ttc,
            worker_pos=(worker.footpoint[0], worker.footpoint[1]),
            machine_pos=(machine.footpoint[0], machine.footpoint[1])
        )
