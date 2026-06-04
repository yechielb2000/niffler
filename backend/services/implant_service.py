from pathlib import Path

from backend.builder import compile_implant


def build_implant_payload(output_path: Path) -> Path:
    """Compile the implant payload and return the generated file path."""
    return compile_implant(output_path)
