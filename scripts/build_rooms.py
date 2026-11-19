"""
Generates valid, standalone glTF 2.0 Binary (.glb) room environments for Three.js.
Produces:
1. assets/rooms/studio_room.glb
2. assets/rooms/cozy_bedroom.glb
"""
import os
import json
import struct
import math

class GLBBuilder:
    def __init__(self):
        self.bin_data = bytearray()
        self.buffer_views = []
        self.accessors = []
        self.materials = []
        self.meshes = []
        self.nodes = []
        self.scenes = [{"nodes": []}]

    def add_material(self, name, base_color=(0.8, 0.8, 0.8, 1.0), roughness=0.7, metallic=0.1, double_sided=False):
        mat = {
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": list(base_color),
                "roughnessFactor": float(roughness),
                "metallicFactor": float(metallic)
            },
            "doubleSided": bool(double_sided)
        }
        self.materials.append(mat)
        return len(self.materials) - 1

    def _pad_bin(self, alignment=4):
        pad = (alignment - (len(self.bin_data) % alignment)) % alignment
        self.bin_data.extend(b'\x00' * pad)

    def add_mesh_primitive(self, name, positions, normals, uvs, indices, material_idx):
        self._pad_bin(4)
        
        # 1. Indices buffer
        idx_offset = len(self.bin_data)
        idx_bytes = struct.pack(f'<{len(indices)}H', *indices)
        self.bin_data.extend(idx_bytes)
        self._pad_bin(4)
        idx_bv = len(self.buffer_views)
        self.buffer_views.append({
            "buffer": 0,
            "byteOffset": idx_offset,
            "byteLength": len(idx_bytes),
            "target": 34963 # ELEMENT_ARRAY_BUFFER
        })
        idx_accessor = len(self.accessors)
        self.accessors.append({
            "bufferView": idx_bv,
            "byteOffset": 0,
            "componentType": 5123, # UNSIGNED_SHORT
            "count": len(indices),
            "type": "SCALAR",
            "min": [int(min(indices))],
            "max": [int(max(indices))]
        })

        # 2. Positions buffer
        pos_offset = len(self.bin_data)
        flat_pos = [coord for p in positions for coord in p]
        pos_bytes = struct.pack(f'<{len(flat_pos)}f', *flat_pos)
        self.bin_data.extend(pos_bytes)
        self._pad_bin(4)
        pos_bv = len(self.buffer_views)
        self.buffer_views.append({
            "buffer": 0,
            "byteOffset": pos_offset,
            "byteLength": len(pos_bytes),
            "target": 34962 # ARRAY_BUFFER
        })
        min_p = [min(p[i] for p in positions) for i in range(3)]
        max_p = [max(p[i] for p in positions) for i in range(3)]
        pos_accessor = len(self.accessors)
        self.accessors.append({
            "bufferView": pos_bv,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(positions),
            "type": "VEC3",
            "min": min_p,
            "max": max_p
        })

        # 3. Normals buffer
        norm_offset = len(self.bin_data)
        flat_norm = [coord for n in normals for coord in n]
        norm_bytes = struct.pack(f'<{len(flat_norm)}f', *flat_norm)
        self.bin_data.extend(norm_bytes)
        self._pad_bin(4)
        norm_bv = len(self.buffer_views)
        self.buffer_views.append({
            "buffer": 0,
            "byteOffset": norm_offset,
            "byteLength": len(norm_bytes),
            "target": 34962
        })
        norm_accessor = len(self.accessors)
        self.accessors.append({
            "bufferView": norm_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(normals),
            "type": "VEC3"
        })

        # 4. UVs buffer
        uv_offset = len(self.bin_data)
        flat_uv = [coord for uv in uvs for coord in uv]
        uv_bytes = struct.pack(f'<{len(flat_uv)}f', *flat_uv)
        self.bin_data.extend(uv_bytes)
        self._pad_bin(4)
        uv_bv = len(self.buffer_views)
        self.buffer_views.append({
            "buffer": 0,
            "byteOffset": uv_offset,
            "byteLength": len(uv_bytes),
            "target": 34962
        })
        uv_accessor = len(self.accessors)
        self.accessors.append({
            "bufferView": uv_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(uvs),
            "type": "VEC2"
        })

        mesh_idx = len(self.meshes)
        self.meshes.append({
            "name": name,
            "primitives": [{
                "attributes": {
                    "POSITION": pos_accessor,
                    "NORMAL": norm_accessor,
                    "TEXCOORD_0": uv_accessor
                },
                "indices": idx_accessor,
                "material": material_idx
            }]
        })
        return mesh_idx

    def add_node(self, name, mesh_idx=None, translation=(0, 0, 0), rotation=(0, 0, 0, 1), scale=(1, 1, 1), children=None):
        node = {"name": name}
        if mesh_idx is not None:
            node["mesh"] = mesh_idx
        if translation != (0, 0, 0):
            node["translation"] = list(translation)
        if rotation != (0, 0, 0, 1):
            node["rotation"] = list(rotation)
        if scale != (1, 1, 1):
            node["scale"] = list(scale)
        if children:
            node["children"] = list(children)
        node_idx = len(self.nodes)
        self.nodes.append(node)
        return node_idx

    def build_glb(self, output_path):
        self._pad_bin(4)
        gltf = {
            "asset": {"version": "2.0", "generator": "Antigravity Three.js Room Builder"},
            "scene": 0,
            "scenes": [{"nodes": list(range(len(self.nodes)))}],
            "nodes": self.nodes,
            "meshes": self.meshes,
            "materials": self.materials,
            "accessors": self.accessors,
            "bufferViews": self.buffer_views,
            "buffers": [{"byteLength": len(self.bin_data)}]
        }
        json_str = json.dumps(gltf, separators=(',', ':'))
        json_bytes = json_str.encode('utf-8')
        json_pad = (4 - (len(json_bytes) % 4)) % 4
        json_bytes += b' ' * json_pad

        bin_pad = (4 - (len(self.bin_data) % 4)) % 4
        self.bin_data.extend(b'\x00' * bin_pad)

        total_length = 12 + 8 + len(json_bytes) + 8 + len(self.bin_data)
        header = struct.pack('<4sII', b'glTF', 2, total_length)
        chunk0_header = struct.pack('<II', len(json_bytes), 0x4E4F534A) # JSON
        chunk1_header = struct.pack('<II', len(self.bin_data), 0x004E4942) # BIN

        with open(output_path, 'wb') as f:
            f.write(header)
            f.write(chunk0_header)
            f.write(json_bytes)
            f.write(chunk1_header)
            f.write(self.bin_data)
        print(f"Generated GLB: {output_path} ({total_length} bytes)")

def create_box_primitive(w, h, d, center=(0, 0, 0)):
    cx, cy, cz = center
    hw, hh, hd = w / 2, h / 2, d / 2
    # 6 faces: +Z, -Z, +X, -X, +Y, -Y
    faces = [
        # +Z Front
        ([ (cx - hw, cy - hh, cz + hd), (cx + hw, cy - hh, cz + hd), (cx + hw, cy + hh, cz + hd), (cx - hw, cy + hh, cz + hd) ], (0, 0, 1)),
        # -Z Back
        ([ (cx + hw, cy - hh, cz - hd), (cx - hw, cy - hh, cz - hd), (cx - hw, cy + hh, cz - hd), (cx + hw, cy + hh, cz - hd) ], (0, 0, -1)),
        # +X Right
        ([ (cx + hw, cy - hh, cz + hd), (cx + hw, cy - hh, cz - hd), (cx + hw, cy + hh, cz - hd), (cx + hw, cy + hh, cz + hd) ], (1, 0, 0)),
        # -X Left
        ([ (cx - hw, cy - hh, cz - hd), (cx - hw, cy - hh, cz + hd), (cx - hw, cy + hh, cz + hd), (cx - hw, cy + hh, cz - hd) ], (-1, 0, 0)),
        # +Y Top
        ([ (cx - hw, cy + hh, cz + hd), (cx + hw, cy + hh, cz + hd), (cx + hw, cy + hh, cz - hd), (cx - hw, cy + hh, cz - hd) ], (0, 1, 0)),
        # -Y Bottom
        ([ (cx - hw, cy - hh, cz - hd), (cx + hw, cy - hh, cz - hd), (cx + hw, cy - hh, cz + hd), (cx - hw, cy - hh, cz + hd) ], (0, -1, 0)),
    ]
    positions = []
    normals = []
    uvs = []
    indices = []
    v_offset = 0

    for verts, norm in faces:
        positions.extend(verts)
        normals.extend([norm] * 4)
        uvs.extend([(0, 0), (1, 0), (1, 1), (0, 1)])
        indices.extend([v_offset, v_offset + 1, v_offset + 2, v_offset, v_offset + 2, v_offset + 3])
        v_offset += 4

    return positions, normals, uvs, indices

def create_cylinder_primitive(radius_top, radius_bottom, height, segments=16, center=(0, 0, 0)):
    cx, cy, cz = center
    hh = height / 2
    positions = []
    normals = []
    uvs = []
    indices = []
    
    # Side vertices
    for i in range(segments + 1):
        theta = i * 2 * math.pi / segments
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        u = i / segments

        # Top
        p_top = (cx + radius_top * cos_t, cy + hh, cz + radius_top * sin_t)
        # Bottom
        p_bot = (cx + radius_bottom * cos_t, cy - hh, cz + radius_bottom * sin_t)
        
        n = (cos_t, 0, sin_t)
        positions.extend([p_top, p_bot])
        normals.extend([n, n])
        uvs.extend([(u, 1), (u, 0)])

    for i in range(segments):
        idx = i * 2
        indices.extend([idx, idx + 1, idx + 2, idx + 1, idx + 3, idx + 2])

    # Top Cap
    top_center_idx = len(positions)
    positions.append((cx, cy + hh, cz))
    normals.append((0, 1, 0))
    uvs.append((0.5, 0.5))

    cap_start = len(positions)
    for i in range(segments + 1):
        theta = i * 2 * math.pi / segments
        positions.append((cx + radius_top * math.cos(theta), cy + hh, cz + radius_top * math.sin(theta)))
        normals.append((0, 1, 0))
        uvs.append((0.5 + 0.5 * math.cos(theta), 0.5 + 0.5 * math.sin(theta)))

    for i in range(segments):
        indices.extend([top_center_idx, cap_start + i, cap_start + i + 1])

    return positions, normals, uvs, indices

def build_studio_room(output_path):
    builder = GLBBuilder()

    # Materials
    m_floor = builder.add_material("Mat_Floor_Wood", (0.55, 0.38, 0.25, 1.0), roughness=0.45, metallic=0.05)
    m_backwall = builder.add_material("Mat_Wall_DarkNavy", (0.08, 0.12, 0.18, 1.0), roughness=0.85, metallic=0.0)
    m_sidewall = builder.add_material("Mat_Wall_OffWhite", (0.88, 0.89, 0.90, 1.0), roughness=0.9, metallic=0.0)
    m_baseboard = builder.add_material("Mat_Baseboard", (0.95, 0.95, 0.95, 1.0), roughness=0.5, metallic=0.1)
    m_desk_wood = builder.add_material("Mat_Desk_Oak", (0.70, 0.52, 0.35, 1.0), roughness=0.35, metallic=0.0)
    m_desk_metal = builder.add_material("Mat_Desk_BlackMetal", (0.12, 0.12, 0.13, 1.0), roughness=0.3, metallic=0.8)
    m_monitor_screen = builder.add_material("Mat_Monitor_Screen", (0.02, 0.05, 0.08, 1.0), roughness=0.15, metallic=0.1)
    m_monitor_frame = builder.add_material("Mat_Monitor_Frame", (0.1, 0.1, 0.1, 1.0), roughness=0.4, metallic=0.5)
    m_lamp_brass = builder.add_material("Mat_Lamp_Brass", (0.85, 0.70, 0.30, 1.0), roughness=0.25, metallic=0.85)
    m_plant_pot = builder.add_material("Mat_Plant_Pot", (0.92, 0.90, 0.86, 1.0), roughness=0.6, metallic=0.0)
    m_plant_leaves = builder.add_material("Mat_Plant_Leaves", (0.15, 0.45, 0.20, 1.0), roughness=0.5, metallic=0.0)
    m_shelf_wood = builder.add_material("Mat_Shelf_Walnut", (0.35, 0.22, 0.14, 1.0), roughness=0.4, metallic=0.0)
    m_book_red = builder.add_material("Mat_Book_Red", (0.80, 0.18, 0.15, 1.0), roughness=0.7, metallic=0.0)
    m_book_blue = builder.add_material("Mat_Book_Blue", (0.18, 0.35, 0.80, 1.0), roughness=0.7, metallic=0.0)
    m_poster_art = builder.add_material("Mat_Poster_Art", (0.95, 0.85, 0.45, 1.0), roughness=0.6, metallic=0.0)
    m_poster_frame = builder.add_material("Mat_Poster_Frame", (0.05, 0.05, 0.05, 1.0), roughness=0.3, metallic=0.4)

    # 1. Floor (centered at 0, 0, 0)
    p, n, uv, idx = create_box_primitive(6.0, 0.1, 6.0, center=(0, -0.05, 0))
    builder.add_node("Floor", builder.add_mesh_primitive("Mesh_Floor", p, n, uv, idx, m_floor))

    # 2. Back Wall (z = -3.0)
    p, n, uv, idx = create_box_primitive(6.0, 3.5, 0.1, center=(0, 1.7, -3.0))
    builder.add_node("BackWall", builder.add_mesh_primitive("Mesh_BackWall", p, n, uv, idx, m_backwall))

    # 3. Left Wall (x = -3.0)
    p, n, uv, idx = create_box_primitive(0.1, 3.5, 6.0, center=(-3.0, 1.7, 0))
    builder.add_node("LeftWall", builder.add_mesh_primitive("Mesh_LeftWall", p, n, uv, idx, m_sidewall))

    # 4. Right Wall (x = 3.0)
    p, n, uv, idx = create_box_primitive(0.1, 3.5, 6.0, center=(3.0, 1.7, 0))
    builder.add_node("RightWall", builder.add_mesh_primitive("Mesh_RightWall", p, n, uv, idx, m_sidewall))

    # 5. Baseboards
    p, n, uv, idx = create_box_primitive(6.0, 0.15, 0.05, center=(0, 0.075, -2.95))
    builder.add_node("Baseboard_Back", builder.add_mesh_primitive("Mesh_Baseboard_Back", p, n, uv, idx, m_baseboard))
    p, n, uv, idx = create_box_primitive(0.05, 0.15, 6.0, center=(-2.95, 0.075, 0))
    builder.add_node("Baseboard_Left", builder.add_mesh_primitive("Mesh_Baseboard_Left", p, n, uv, idx, m_baseboard))

    # 6. Creator Desk (placed at x = 0, z = -1.6)
    # Desktop
    p, n, uv, idx = create_box_primitive(2.0, 0.06, 0.9, center=(0, 0.75, -1.6))
    builder.add_node("Desk_Top", builder.add_mesh_primitive("Mesh_Desk_Top", p, n, uv, idx, m_desk_wood))
    # Legs (black metal)
    p, n, uv, idx = create_box_primitive(0.06, 0.72, 0.8, center=(-0.9, 0.36, -1.6))
    builder.add_node("Desk_Leg_L", builder.add_mesh_primitive("Mesh_Desk_Leg_L", p, n, uv, idx, m_desk_metal))
    p, n, uv, idx = create_box_primitive(0.06, 0.72, 0.8, center=(0.9, 0.36, -1.6))
    builder.add_node("Desk_Leg_R", builder.add_mesh_primitive("Mesh_Desk_Leg_R", p, n, uv, idx, m_desk_metal))

    # 7. Monitors
    # Main Monitor
    p, n, uv, idx = create_box_primitive(0.85, 0.48, 0.03, center=(0, 1.15, -1.8))
    builder.add_node("Monitor_Main_Frame", builder.add_mesh_primitive("Mesh_Monitor_Main_Frame", p, n, uv, idx, m_monitor_frame))
    p, n, uv, idx = create_box_primitive(0.81, 0.44, 0.005, center=(0, 1.15, -1.78))
    builder.add_node("Monitor_Main_Screen", builder.add_mesh_primitive("Mesh_Monitor_Main_Screen", p, n, uv, idx, m_monitor_screen))
    p, n, uv, idx = create_box_primitive(0.08, 0.35, 0.04, center=(0, 0.92, -1.85))
    builder.add_node("Monitor_Stand_Stem", builder.add_mesh_primitive("Mesh_Monitor_Stand_Stem", p, n, uv, idx, m_monitor_frame))
    p, n, uv, idx = create_box_primitive(0.35, 0.015, 0.22, center=(0, 0.785, -1.8))
    builder.add_node("Monitor_Stand_Base", builder.add_mesh_primitive("Mesh_Monitor_Stand_Base", p, n, uv, idx, m_monitor_frame))

    # Keyboard & Mousepad
    p, n, uv, idx = create_box_primitive(0.75, 0.005, 0.35, center=(0, 0.782, -1.45))
    builder.add_node("Mousepad", builder.add_mesh_primitive("Mesh_Mousepad", p, n, uv, idx, m_desk_metal))
    p, n, uv, idx = create_box_primitive(0.42, 0.015, 0.15, center=(-0.05, 0.795, -1.45))
    builder.add_node("Keyboard", builder.add_mesh_primitive("Mesh_Keyboard", p, n, uv, idx, m_baseboard))

    # 8. Articulated Brass Desk Lamp
    p, n, uv, idx = create_cylinder_primitive(0.08, 0.08, 0.02, center=(0.75, 0.79, -1.65))
    builder.add_node("Lamp_Base", builder.add_mesh_primitive("Mesh_Lamp_Base", p, n, uv, idx, m_lamp_brass))
    p, n, uv, idx = create_box_primitive(0.02, 0.38, 0.02, center=(0.75, 0.98, -1.65))
    builder.add_node("Lamp_Stem", builder.add_mesh_primitive("Mesh_Lamp_Stem", p, n, uv, idx, m_lamp_brass))
    p, n, uv, idx = create_cylinder_primitive(0.06, 0.12, 0.15, center=(0.70, 1.15, -1.60))
    builder.add_node("Lamp_Shade", builder.add_mesh_primitive("Mesh_Lamp_Shade", p, n, uv, idx, m_lamp_brass))

    # 9. Potted Plant (Corner x = -2.2, z = -2.2)
    p, n, uv, idx = create_cylinder_primitive(0.22, 0.16, 0.45, center=(-2.2, 0.225, -2.2))
    builder.add_node("Plant_Pot", builder.add_mesh_primitive("Mesh_Plant_Pot", p, n, uv, idx, m_plant_pot))
    # Plant foliage (multiple stylized leaves/bush spheres)
    p, n, uv, idx = create_box_primitive(0.55, 0.45, 0.55, center=(-2.2, 0.65, -2.2))
    builder.add_node("Plant_Bush", builder.add_mesh_primitive("Mesh_Plant_Bush", p, n, uv, idx, m_plant_leaves))

    # 10. Wall Shelf with Books (Back wall, x = -1.2, y = 2.0, z = -2.9)
    p, n, uv, idx = create_box_primitive(1.4, 0.04, 0.25, center=(-1.2, 2.0, -2.85))
    builder.add_node("Wall_Shelf", builder.add_mesh_primitive("Mesh_Wall_Shelf", p, n, uv, idx, m_shelf_wood))
    p, n, uv, idx = create_box_primitive(0.06, 0.22, 0.18, center=(-1.6, 2.13, -2.85))
    builder.add_node("Book_01", builder.add_mesh_primitive("Mesh_Book_01", p, n, uv, idx, m_book_red))
    p, n, uv, idx = create_box_primitive(0.08, 0.24, 0.18, center=(-1.5, 2.14, -2.85))
    builder.add_node("Book_02", builder.add_mesh_primitive("Mesh_Book_02", p, n, uv, idx, m_book_blue))
    p, n, uv, idx = create_box_primitive(0.05, 0.20, 0.18, center=(-1.4, 2.12, -2.85))
    builder.add_node("Book_03", builder.add_mesh_primitive("Mesh_Book_03", p, n, uv, idx, m_lamp_brass))

    # 11. Framed Art Posters (Back wall, x = 1.2, y = 2.0, z = -2.95)
    p, n, uv, idx = create_box_primitive(0.85, 1.1, 0.03, center=(1.2, 2.0, -2.95))
    builder.add_node("Poster_Frame", builder.add_mesh_primitive("Mesh_Poster_Frame", p, n, uv, idx, m_poster_frame))
    p, n, uv, idx = create_box_primitive(0.75, 1.0, 0.005, center=(1.2, 2.0, -2.93))
    builder.add_node("Poster_Canvas", builder.add_mesh_primitive("Mesh_Poster_Canvas", p, n, uv, idx, m_poster_art))

    builder.build_glb(output_path)

def build_cozy_bedroom(output_path):
    builder = GLBBuilder()

    # Materials
    m_floor = builder.add_material("Mat_Floor_WarmWood", (0.65, 0.48, 0.32, 1.0), roughness=0.4, metallic=0.0)
    m_rug = builder.add_material("Mat_Rug_Cream", (0.92, 0.90, 0.85, 1.0), roughness=0.9, metallic=0.0)
    m_wall_sage = builder.add_material("Mat_Wall_SageGreen", (0.38, 0.48, 0.42, 1.0), roughness=0.85, metallic=0.0)
    m_wall_white = builder.add_material("Mat_Wall_WarmWhite", (0.94, 0.93, 0.91, 1.0), roughness=0.9, metallic=0.0)
    m_bed_wood = builder.add_material("Mat_Bed_Oak", (0.45, 0.30, 0.18, 1.0), roughness=0.5, metallic=0.0)
    m_bed_duvet = builder.add_material("Mat_Bed_Duvet", (0.85, 0.86, 0.90, 1.0), roughness=0.8, metallic=0.0)
    m_bed_pillow = builder.add_material("Mat_Bed_Pillow", (0.95, 0.95, 0.95, 1.0), roughness=0.7, metallic=0.0)
    m_window_frame = builder.add_material("Mat_Window_Frame", (0.95, 0.95, 0.95, 1.0), roughness=0.4, metallic=0.1)
    m_window_glass = builder.add_material("Mat_Window_Glass", (0.45, 0.70, 0.88, 1.0), roughness=0.1, metallic=0.2)
    m_lamp_shade = builder.add_material("Mat_Lamp_Shade", (0.98, 0.92, 0.75, 1.0), roughness=0.6, metallic=0.0)

    # 1. Floor
    p, n, uv, idx = create_box_primitive(6.0, 0.1, 6.0, center=(0, -0.05, 0))
    builder.add_node("Floor", builder.add_mesh_primitive("Mesh_Floor", p, n, uv, idx, m_floor))

    # 2. Large Circular Area Rug
    p, n, uv, idx = create_cylinder_primitive(1.6, 1.6, 0.02, center=(0, 0.01, 0))
    builder.add_node("Area_Rug", builder.add_mesh_primitive("Mesh_Area_Rug", p, n, uv, idx, m_rug))

    # 3. Walls
    p, n, uv, idx = create_box_primitive(6.0, 3.5, 0.1, center=(0, 1.7, -3.0))
    builder.add_node("BackWall", builder.add_mesh_primitive("Mesh_BackWall", p, n, uv, idx, m_wall_sage))
    p, n, uv, idx = create_box_primitive(0.1, 3.5, 6.0, center=(-3.0, 1.7, 0))
    builder.add_node("LeftWall", builder.add_mesh_primitive("Mesh_LeftWall", p, n, uv, idx, m_wall_white))
    p, n, uv, idx = create_box_primitive(0.1, 3.5, 6.0, center=(3.0, 1.7, 0))
    builder.add_node("RightWall", builder.add_mesh_primitive("Mesh_RightWall", p, n, uv, idx, m_wall_white))

    # 4. Large Picture Window (Back wall, centered, y = 2.0, z = -2.95)
    p, n, uv, idx = create_box_primitive(2.2, 1.6, 0.06, center=(0, 2.0, -2.95))
    builder.add_node("Window_Frame", builder.add_mesh_primitive("Mesh_Window_Frame", p, n, uv, idx, m_window_frame))
    p, n, uv, idx = create_box_primitive(2.0, 1.4, 0.01, center=(0, 2.0, -2.95))
    builder.add_node("Window_Glass", builder.add_mesh_primitive("Mesh_Window_Glass", p, n, uv, idx, m_window_glass))

    # 5. Cozy Bed (Placed on right side, x = 1.6, z = -1.5)
    # Bed Frame
    p, n, uv, idx = create_box_primitive(1.5, 0.35, 2.1, center=(1.8, 0.175, -1.8))
    builder.add_node("Bed_Frame", builder.add_mesh_primitive("Mesh_Bed_Frame", p, n, uv, idx, m_bed_wood))
    # Headboard
    p, n, uv, idx = create_box_primitive(1.6, 0.85, 0.08, center=(1.8, 0.55, -2.85))
    builder.add_node("Bed_Headboard", builder.add_mesh_primitive("Mesh_Bed_Headboard", p, n, uv, idx, m_bed_wood))
    # Mattress & Duvet
    p, n, uv, idx = create_box_primitive(1.4, 0.25, 1.9, center=(1.8, 0.42, -1.8))
    builder.add_node("Bed_Duvet", builder.add_mesh_primitive("Mesh_Bed_Duvet", p, n, uv, idx, m_bed_duvet))
    # Pillows
    p, n, uv, idx = create_box_primitive(0.55, 0.12, 0.35, center=(1.45, 0.58, -2.55))
    builder.add_node("Pillow_L", builder.add_mesh_primitive("Mesh_Pillow_L", p, n, uv, idx, m_bed_pillow))
    p, n, uv, idx = create_box_primitive(0.55, 0.12, 0.35, center=(2.15, 0.58, -2.55))
    builder.add_node("Pillow_R", builder.add_mesh_primitive("Mesh_Pillow_R", p, n, uv, idx, m_bed_pillow))

    # 6. Nightstand & Lamp (x = 0.7, z = -2.6)
    p, n, uv, idx = create_box_primitive(0.5, 0.55, 0.45, center=(0.7, 0.275, -2.6))
    builder.add_node("Nightstand", builder.add_mesh_primitive("Mesh_Nightstand", p, n, uv, idx, m_bed_wood))
    p, n, uv, idx = create_cylinder_primitive(0.08, 0.14, 0.25, center=(0.7, 0.68, -2.6))
    builder.add_node("Table_Lamp", builder.add_mesh_primitive("Mesh_Table_Lamp", p, n, uv, idx, m_lamp_shade))

    builder.build_glb(output_path)

if __name__ == "__main__":
    os.makedirs(r"assets/rooms", exist_ok=True)
    build_studio_room(r"assets/rooms/studio_room.glb")
    build_cozy_bedroom(r"assets/rooms/cozy_bedroom.glb")
