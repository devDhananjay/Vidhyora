#!/usr/bin/env python3
"""
Generate Simple Placeholder GLB Models
Creates basic geometric shapes for immediate AR testing
"""

import struct
import json
import base64
import os
from pathlib import Path

def create_simple_ring_glb():
    """
    Create a minimal valid GLB file with a simple ring (torus) shape
    GLB Format: 12-byte header + JSON chunk + Binary chunk
    """
    
    # Create vertices for a simple torus (ring shape)
    # 32 vertices around the circumference
    import math
    vertices = []
    indices = []
    
    major_radius = 0.009  # 9mm radius (ring size)
    minor_radius = 0.001  # 1mm thickness
    segments = 16
    rings = 8
    
    for i in range(rings):
        v = i / rings
        phi = v * 2 * math.pi
        
        for j in range(segments):
            u = j / segments
            theta = u * 2 * math.pi
            
            x = (major_radius + minor_radius * math.cos(theta)) * math.cos(phi)
            y = (major_radius + minor_radius * math.cos(theta)) * math.sin(phi)
            z = minor_radius * math.sin(theta)
            
            vertices.extend([x, y, z])
    
    # Create indices for triangles
    for i in range(rings):
        for j in range(segments):
            a = i * segments + j
            b = i * segments + ((j + 1) % segments)
            c = ((i + 1) % rings) * segments + ((j + 1) % segments)
            d = ((i + 1) % rings) * segments + j
            
            indices.extend([a, b, c, a, c, d])
    
    vertex_count = len(vertices) // 3
    index_count = len(indices)
    
    # Convert to bytes
    vertex_data = struct.pack(f'{len(vertices)}f', *vertices)
    index_data = struct.pack(f'{len(indices)}H', *indices)
    
    # Calculate bounds
    xs = [vertices[i] for i in range(0, len(vertices), 3)]
    ys = [vertices[i] for i in range(1, len(vertices), 3)]
    zs = [vertices[i] for i in range(2, len(vertices), 3)]
    
    # Create glTF JSON
    gltf_json = {
        "asset": {"version": "2.0", "generator": "VIDYORA Placeholder Generator"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{
            "primitives": [{
                "attributes": {"POSITION": 0},
                "indices": 1,
                "material": 0
            }]
        }],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,  # FLOAT
                "count": vertex_count,
                "type": "VEC3",
                "max": [max(xs), max(ys), max(zs)],
                "min": [min(xs), min(ys), min(zs)]
            },
            {
                "bufferView": 1,
                "componentType": 5123,  # UNSIGNED_SHORT
                "count": index_count,
                "type": "SCALAR"
            }
        ],
        "bufferViews": [
            {
                "buffer": 0,
                "byteOffset": 0,
                "byteLength": len(vertex_data),
                "target": 34962  # ARRAY_BUFFER
            },
            {
                "buffer": 0,
                "byteOffset": len(vertex_data),
                "byteLength": len(index_data),
                "target": 34963  # ELEMENT_ARRAY_BUFFER
            }
        ],
        "buffers": [{
            "byteLength": len(vertex_data) + len(index_data)
        }],
        "materials": [{
            "pbrMetallicRoughness": {
                "baseColorFactor": [1.0, 0.843, 0.0, 1.0],  # Gold color
                "metallicFactor": 1.0,
                "roughnessFactor": 0.1
            }
        }]
    }
    
    # Convert JSON to bytes
    json_str = json.dumps(gltf_json, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    
    # Pad JSON to 4-byte alignment
    json_padding = (4 - len(json_bytes) % 4) % 4
    json_bytes += b' ' * json_padding
    
    # Binary data (vertices + indices)
    bin_data = vertex_data + index_data
    bin_padding = (4 - len(bin_data) % 4) % 4
    bin_data += b'\x00' * bin_padding
    
    # Create GLB file
    # Header: magic, version, length
    magic = 0x46546C67  # "glTF"
    version = 2
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
    
    glb = struct.pack('<III', magic, version, total_length)
    
    # JSON chunk
    glb += struct.pack('<II', len(json_bytes), 0x4E4F534A)  # "JSON"
    glb += json_bytes
    
    # Binary chunk
    glb += struct.pack('<II', len(bin_data), 0x004E4942)  # "BIN\0"
    glb += bin_data
    
    return glb

def main():
    """Generate placeholder GLB files"""
    
    base_dir = Path('/Users/meondev/Desktop/VIDYORA/public/models')
    
    # Create directories
    directories = ['rings', 'bangles', 'earrings', 'necklaces', 'nose-pins']
    for dir_name in directories:
        (base_dir / dir_name).mkdir(parents=True, exist_ok=True)
    
    print('🎨 Generating placeholder 3D models...')
    print('')
    
    # Generate ring GLB
    ring_glb = create_simple_ring_glb()
    
    # Write to all jewelry type folders
    files = [
        base_dir / 'rings' / 'sample-ring.glb',
        base_dir / 'bangles' / 'sample-bangle.glb',
        base_dir / 'earrings' / 'sample-earring.glb',
        base_dir / 'necklaces' / 'sample-necklace.glb',
        base_dir / 'nose-pins' / 'sample-nose-pin.glb',
    ]
    
    for file_path in files:
        with open(file_path, 'wb') as f:
            f.write(ring_glb)
        size_kb = len(ring_glb) / 1024
        print(f'✅ Created: {file_path.parent.name}/{file_path.name} ({size_kb:.1f} KB)')
    
    print('')
    print('🎉 Success! All placeholder models created!')
    print('')
    print('📍 Location: public/models/')
    print('')
    print('⚠️  Important Notes:')
    print('   • These are BASIC geometric shapes (torus/ring)')
    print('   • They will work immediately in AR!')
    print('   • Replace with real models later for better quality')
    print('')
    print('🚀 Next Steps:')
    print('   1. npm run dev')
    print('   2. Open product page → Try AR')
    print('   3. Enable "3D Mode (Beta)"')
    print('   4. Show hand to camera → See the model!')
    print('')
    print('💡 To get professional models:')
    print('   • Check: FREE_3D_MODELS_SETUP.md')
    print('   • Or run: ./scripts/download-models.sh')

if __name__ == '__main__':
    main()
