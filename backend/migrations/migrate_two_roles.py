#!/usr/bin/env python3
"""Migrate conversations to administrator/participant roles.

Runs as a dry-run unless --apply is provided. The operation is idempotent.
"""

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


def normalize_group(group):
    member_ids = list(dict.fromkeys(group.get("member_ids", [])))
    creator_id = group.get("creator_id")
    old_roles = group.get("member_roles") or {}
    old_permissions = group.get("member_role_permissions") or {}
    roles = {}
    permissions = {}

    for member_id in member_ids:
        old_role = old_roles.get(member_id)
        role = "host" if member_id == creator_id or old_role == "host" else "participant"
        roles[member_id] = role

        if role == "host":
            if member_id == creator_id:
                permissions[member_id] = True
            elif member_id in old_permissions:
                permissions[member_id] = bool(old_permissions[member_id])
            else:
                permissions[member_id] = True

    return roles, permissions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Persist changes")
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env")
    client = MongoClient(os.environ["MONGO_URL"])
    groups = client[os.environ["DB_NAME"]].groups

    scanned = 0
    changed = 0
    observers_converted = 0

    for group in groups.find({}):
        scanned += 1
        roles, permissions = normalize_group(group)
        old_roles = group.get("member_roles") or {}
        observers_converted += sum(
            1 for member_id in group.get("member_ids", [])
            if old_roles.get(member_id) == "observer"
        )
        if (
            roles == old_roles
            and permissions == (group.get("member_role_permissions") or {})
        ):
            continue

        changed += 1
        if args.apply:
            groups.update_one(
                {"_id": group["_id"]},
                {"$set": {
                    "member_roles": roles,
                    "member_role_permissions": permissions,
                }},
            )

    mode = "applied" if args.apply else "dry-run"
    print(
        f"mode={mode} scanned={scanned} changed={changed} "
        f"observers_converted={observers_converted}"
    )


if __name__ == "__main__":
    main()
