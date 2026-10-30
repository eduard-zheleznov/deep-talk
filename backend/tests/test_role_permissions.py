import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "deeptalk_test")

from server import (  # noqa: E402
    can_manage_member_roles,
    normalize_member_role_permissions,
    normalize_member_roles,
)


def test_legacy_observer_becomes_participant():
    group = {
        "creator_id": "creator",
        "member_ids": ["creator", "observer"],
        "member_roles": {"creator": "host", "observer": "observer"},
    }

    roles = normalize_member_roles(group)

    assert roles == {"creator": "host", "observer": "participant"}


def test_creator_always_manages_roles_and_legacy_host_keeps_access():
    group = {
        "creator_id": "creator",
        "member_ids": ["creator", "legacy_admin", "member"],
        "member_roles": {
            "creator": "host",
            "legacy_admin": "host",
            "member": "participant",
        },
    }
    roles = normalize_member_roles(group)
    permissions = normalize_member_role_permissions(group, roles)
    group["member_roles"] = roles
    group["member_role_permissions"] = permissions

    assert permissions == {"creator": True, "legacy_admin": True}
    assert can_manage_member_roles(group, "creator") is True
    assert can_manage_member_roles(group, "legacy_admin") is True
    assert can_manage_member_roles(group, "member") is False


def test_admin_without_delegation_cannot_manage_roles():
    group = {
        "creator_id": "creator",
        "member_ids": ["creator", "limited_admin"],
        "member_roles": {"creator": "host", "limited_admin": "host"},
        "member_role_permissions": {"creator": True, "limited_admin": False},
    }
    roles = normalize_member_roles(group)
    permissions = normalize_member_role_permissions(group, roles)
    group["member_roles"] = roles
    group["member_role_permissions"] = permissions

    assert permissions["limited_admin"] is False
    assert can_manage_member_roles(group, "limited_admin") is False
