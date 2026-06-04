from pathlib import Path

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "backend" / "config.yaml"


def _load_yaml_defaults() -> dict[str, object]:
    if not CONFIG_FILE.exists():
        return {}

    with CONFIG_FILE.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


class ServerSettings(BaseSettings):
    c2_endpoint: str = Field(default="http://localhost:8000/v2/gateway")
    shared_key: str = Field(default="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
    beacon_interval: int = Field(default=20)
    jitter: int = Field(default=5)

    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        def yaml_source() -> dict[str, object]:
            return _load_yaml_defaults()

        return (
            init_settings,
            env_settings,
            yaml_source,
            file_secret_settings,
        )


def get_settings() -> ServerSettings:
    return ServerSettings()
