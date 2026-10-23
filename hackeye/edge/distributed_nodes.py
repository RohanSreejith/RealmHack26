"""
Distributed Edge Inference Architecture Model
Simulates a facility-scale distributed architecture hosting 50-100 cameras partitioned across horizontal Edge Nodes.
Demonstrates that heavy AI compute is distributed across dedicated edge nodes rather than overloading a single device,
with lightweight physical alert nodes handling the physical response layer.
"""
import time
from typing import Dict, Any, List

class EdgeInferenceNode:
    def __init__(self, node_id: str, zone_name: str, camera_range: str, camera_count: int = 10):
        self.node_id = node_id
        self.zone_name = zone_name
        self.camera_range = camera_range
        self.camera_count = camera_count
        self.status = "ONLINE"
        self.hardware_profile = "NVIDIA Jetson Orin Nano / RTX Edge Gateway"
        self.active_vision_cameras = 2
        self.low_compute_cameras = camera_count - 2
        self.avg_fps = 29.4
        self.cpu_load_pct = 34.0
        self.gpu_load_pct = 42.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "zone_name": self.zone_name,
            "camera_range": self.camera_range,
            "total_cameras": self.camera_count,
            "active_vision_cameras": self.active_vision_cameras,
            "low_compute_cameras": self.low_compute_cameras,
            "status": self.status,
            "hardware_profile": self.hardware_profile,
            "avg_fps": self.avg_fps,
            "cpu_load_pct": self.cpu_load_pct,
            "gpu_load_pct": self.gpu_load_pct
        }

class DistributedEdgeClusterManager:
    """Manages 50 CCTV cameras partitioned across 5 edge inference nodes."""
    def __init__(self):
        self.nodes: Dict[str, EdgeInferenceNode] = {
            "EDGE_NODE_01": EdgeInferenceNode("EDGE_NODE_01", "Zone 01: Loading Bay / Entrance", "Cameras 01–10", 10),
            "EDGE_NODE_02": EdgeInferenceNode("EDGE_NODE_02", "Zone 02: High-Bay Aisle 04", "Cameras 11–20", 10),
            "EDGE_NODE_03": EdgeInferenceNode("EDGE_NODE_03", "Zone 03: Crane / Heavy Machinery", "Cameras 21–30", 10),
            "EDGE_NODE_04": EdgeInferenceNode("EDGE_NODE_04", "Zone 04: Storage Racking & Stacking", "Cameras 31–40", 10),
            "EDGE_NODE_05": EdgeInferenceNode("EDGE_NODE_05", "Zone 05: Pedestrian Egress & Exits", "Cameras 41–50", 10)
        }

    def get_cluster_telemetry(self) -> Dict[str, Any]:
        total_cams = sum(n.camera_count for n in self.nodes.values())
        active_vision = sum(n.active_vision_cameras for n in self.nodes.values())
        low_compute = total_cams - active_vision
        
        # Calculate cluster-wide GPU compute reduction
        compute_saved_pct = round((low_compute / float(total_cams)) * 100.0, 1)

        return {
            "total_facilities": 1,
            "total_edge_nodes": len(self.nodes),
            "total_cameras_monitored": total_cams,
            "cameras_in_vision_analysis": active_vision,
            "cameras_in_low_compute": low_compute,
            "cluster_gpu_savings_pct": f"{compute_saved_pct}%",
            "cluster_health": "OPTIMAL (All Nodes Online)",
            "nodes": [node.to_dict() for node in self.nodes.values()]
        }

distributed_cluster_manager = DistributedEdgeClusterManager()
