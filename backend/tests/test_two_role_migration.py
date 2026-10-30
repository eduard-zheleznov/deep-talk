import importlib.util
from pathlib import Path


MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "migrations"
    / "migrate_two_roles.py"
)
SPEC = importlib.util.spec_from_file_location("migrate_two_roles", MIGRATION_PATH)
MIGRATION = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MIGRATION)


def test_migration_converts_observers_and_preserves_legacy_admin_access():
    roles, permissions = MIGRATION.normalize_group({
        "creator_id": "creator",
        "member_ids": ["creator", "admin", "observer", "participant"],
        "member_roles": {
            "creator": "host",
            "admin": "host",
            "observer": "observer",
            "participant": "participant",
        },
    })

    assert roles == {
        "creator": "host",
        "admin": "host",
        "observer": "participant",
        "participant": "participant",
    }
    assert permissions == {"creator": True, "admin": True}


def test_migration_keeps_explicit_limited_admin_permission():
    roles, permissions = MIGRATION.normalize_group({
        "creator_id": "creator",
        "member_ids": ["creator", "limited"],
        "member_roles": {"creator": "host", "limited": "host"},
        "member_role_permissions": {"creator": True, "limited": False},
    })

    assert roles == {"creator": "host", "limited": "host"}
    assert permissions == {"creator": True, "limited": False}
