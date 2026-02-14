"""Test which Gemini models work with Vertex AI"""
import vertexai
from vertexai.preview.generative_models import GenerativeModel
import os

project_id = 'pravartak-15665'
location = 'us-central1'

# Fix Windows encoding
import sys
import io
if sys.platform == 'win32':
    try:
        if hasattr(sys.stdout, 'buffer') and sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    except:
        pass

print(f"Initializing Vertex AI with project: {project_id}, location: {location}")
try:
    vertexai.init(project=project_id, location=location)
    print("[OK] Vertex AI initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize Vertex AI: {e}")
    exit(1)

# Test different model names
models_to_test = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
]

print("\n" + "="*60)
print("Testing Gemini Models")
print("="*60)

for model_name in models_to_test:
    print(f"\nTesting: {model_name}")
    try:
        model = GenerativeModel(model_name)
        print(f"  [SUCCESS] {model_name} is available!")
        # Try a simple test generation
        try:
            response = model.generate_content("Say hello")
            print(f"  [OK] Test generation works: {response.text[:50]}...")
        except Exception as gen_e:
            print(f"  [WARN] Model loaded but generation failed: {gen_e}")
    except Exception as e:
        print(f"  [FAILED] {e}")

print("\n" + "="*60)

